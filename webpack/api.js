/*
1. register
2. confirm registration
3. add password
4. search passwords
*/

const express = require('express');
const api = express();
const db = require('./db');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const mailer = require('./mailer');
const { port } = require('./constants');
const { generateToken, getPbkdf2Hash, generateTokenWithExpiry, didTokenExpire } = require('./crypto');
const { escape } = require('sqlstring');

api.use(bodyParser.json());
api.use(cookieParser());

let cookieName = 'cookieName';
let cookieSalt = 'cookieSalt';

const csrfCookieName = 'csrfToken';

(async () => {
    cookieName = (await generateToken()).slice(0, 10);
    cookieSalt = await generateToken();
})();

const unquote = str => str.replace(/^'|'$/g, '');

api.use((req, res, next) => {
    for (const field of ['body', 'query']) {
        for (let k in req[field]) {
            req[field][k] = unquote(escape(req[field][k]));
        }
    }

    next();
});


const logUserOut = async (req, res) => {
    await db.prepare(`
        UPDATE users 
            SET authToken = NULL
        WHERE authToken = ?
    `).runAsync(getPbkdf2Hash(req.cookies[cookieName], cookieSalt));

    res.clearCookie(cookieName);
};

const CSRFProtection = async (req, res) => {
    if (req.body[csrfCookieName] !== req.cookies[csrfCookieName]) {
        await logUserOut(req, res);
        throw new Error('possible CSRF attack detected, logging user out');
    }
};

const callbackWithError = (res, cb) => function (err) {
    if (err) {
        console.error(err);
        res.sendStatus(400);
    } else {
        if (cb) cb(res);
        else res.sendStatus(200);
    }
};

api.post('/register', async (req, res, next) => {
    try {
        const { body } = req;

        const token = await generateToken();
        const salt = await generateToken();

        await db.prepare(`
            INSERT INTO users (username, email, password, salt, activationToken, active) 
            VALUES (?, ?, ?, ?, ?, 0);
        `).runAsync(
            body.username,
            body.email,
            getPbkdf2Hash(body.password, salt),
            salt,
            token,
        );

        const hostname = `${req.protocol}://${req.hostname}`;
        const confirmationUrl = `${hostname}/confirm?token=${token}`;
        await mailer.sendConfirmationEmail(unquote(body.email), confirmationUrl);
        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
});

api.post('/forgot-password', async (req, res, next) => {
    try {
        const { body } = req;

        const token = await generateTokenWithExpiry();

        const user = await getUserFromEmail(req.body.email);

        if (!user) {
            throw new Error('Could not authenticate user.');
        }

        await db.prepare(`
            UPDATE users SET
                recoveryToken = ?
            WHERE id = ?
        `).runAsync(token, user.id);

        const hostname = `${req.protocol}://${req.hostname}`;
        const recoveryUrl = `${hostname}/recover?token=${token}`;
        await mailer.sendRecoveryEmail(user.email, recoveryUrl);
        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
});

api.post('/change-password', async (req, res, next) => {
    try {

        if (didTokenExpire(req.body.token)) {
            await db.prepare(`
                UPDATE users SET 
                    recoveryToken = NULL 
                WHERE recoveryToken = ?
            `).runAsync(req.body.token);
            throw new Error('token expired');
        }

        const row = await db.prepare(`
            SELECT count(*) 
            FROM users 
            WHERE recoveryToken = ?
        `).getAsync(req.body.token);

        if (row['count(*)'] !== 1) {
            throw new Error('Could not authenticate user.');
        }

        const salt = await generateToken();

        await db.prepare(`
            UPDATE users SET 
                password = ?,
                salt = ?,
                recoveryToken = NULL 
            WHERE recoveryToken = ?
        `).runAsync(getPbkdf2Hash(req.body.password, salt), salt, req.body.token);

        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
});

api.get('/users', async (req, res, next) => {
    try {
        const users = await db.allAsync(`SELECT * from users`);
        res.send(users);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
});

api.get('/sites', async (req, res, next) => {
    try {
        const users = await db.allAsync(`SELECT * from passwords`);
        res.send(users);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
});

api.post('/confirm', async (req, res, next) => {
    try {
        const row = await db.prepare(`
            SELECT count(*) 
            FROM users 
            WHERE activationToken = ?
        `).getAsync(req.body.token);

        if (row['count(*)'] !== 1) {
            throw new Error('Could not authenticate user.');
        }

        await db.prepare(`
            UPDATE users 
                SET active = 1, activationToken = NULL 
            WHERE activationToken = ?
        `).runAsync(req.body.token);

        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
});

const setCookie = (res, value) => {
    res.cookie(cookieName, value, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
        sameSite: true,
        secure: process.env.NODE_ENV === 'production'
    });
};

const setCsrfCookie = (res, value) => {
    res.cookie(csrfCookieName, value, {
        maxAge: 60 * 60 * 1000,
        sameSite: true,
        secure: process.env.NODE_ENV === 'production'
    });
};

api.post('/login', async (req, res, next) => {
    try {
        const { body } = req;

        const row = await db.prepare(`
            SELECT salt, password, active 
            FROM users 
            WHERE username = ?
        `).getAsync(body.username);

        if (!row || !row.active) {
            throw new Error('Could not authenticate user');
        }

        const password = getPbkdf2Hash(body.password, row.salt);
        if (password !== row.password) {
            throw new Error('Wrong password.');
        }

        const token = await generateToken();
        
        await db.prepare(`
            UPDATE users 
            SET authToken = ?
            WHERE username = ?
        `).runAsync(getPbkdf2Hash(token, cookieSalt), body.username);
        
        setCookie(res, token);

        const csrfToken = await generateToken();
        setCsrfCookie(res, csrfToken);

        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(401);
    }
});

const getUserFromAuthToken = async (authToken) => {
    try {
        const row = await db.prepare(`
            SELECT *
            FROM users 
            WHERE authToken = ?
        `).getAsync(getPbkdf2Hash(authToken, cookieSalt));

        if (!row || !row.active) return null;
        return row;
    } catch (e) {
        console.error(e);
        return null
    }
};

const getUserFromEmail = async (email) => {
    try {
        const row = await db.prepare(`
            SELECT *
            FROM users 
            WHERE email = ?
        `).getAsync(email);

        if (!row || !row.active) return null;
        return row;
    } catch (e) {
        console.error(e);
        return null
    }
};

const getUserIdFromAuthToken = async (authToken) => {
    const user = await getUserFromAuthToken(authToken);
    return user ? user.id : null;
};

api.post('/refresh', async (req, res, next) => {
    try {
        const { body, cookies } = req;

        if (!cookies[cookieName]) {
            return res.sendStatus(401);
        }

        await CSRFProtection(req, res);

        const user = await getUserFromAuthToken(cookies[cookieName]);

        if (!user) {
            return res.sendStatus(401);
        }

        const token = await generateToken();
        
        await db.prepare(`
        UPDATE users 
        SET authToken = ?
        WHERE id = ?
        `).runAsync(getPbkdf2Hash(token, cookieSalt), user.id);
        
        setCookie(res, token);

        const csrfToken = await generateToken();
        setCsrfCookie(res, csrfToken);

        res.send({
            username: user.username
        });
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
});

api.post('/logout', async (req, res, next) => {
    try {
        await logUserOut(req, res);
        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(401);
    }
});

api.post('/passwords', async (req, res, next) => {
    try {

        await CSRFProtection(req, res);

        const { body, cookies } = req;

        if (!cookies[cookieName]) {
            return res.sendStatus(401);
        }

        const userId = await getUserIdFromAuthToken(cookies[cookieName]);

        if (!userId) {
            return res.sendStatus(401);
        }

        await db.prepare(`
            INSERT INTO passwords (site, site_username, site_password, user_id)
            VALUES (?, ?, ?, ?)
        `).runAsync(
            body.site,
            body.site_username,
            body.site_password,
            userId
        );

        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }

});

api.post('/passwords/search', async (req, res, next) => {
    try {

        await CSRFProtection(req, res);

        const userId = await getUserIdFromAuthToken(req.cookies[cookieName]);

        if (!userId) {
            return res.sendStatus(401);
        }

        const rows = await db.prepare(`
            SELECT 
                id,
                site,
                site_username,
                site_password
            FROM passwords 
            WHERE 
                user_id = ? AND
                site = ?
        `).allAsync(userId, req.body.site);

        res.send(rows);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
});

module.exports = api;