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
const { generateToken, getHash } = require('./crypto');
const { escape } = require('sqlstring');

api.use(bodyParser.json());
api.use(cookieParser());

api.use((req, res, next) => {
    for (const field of ['body', 'cookies', 'query']) {
        for (let k in req[field]) {
            req[field][k] = escape(req[field][k]);
        }
    }

    next();
});

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
        await db.runAsync(`
            INSERT INTO users (username, email, password, salt, activationToken, active) 
            VALUES (
                ${body.username},
                ${body.email},
                "${getHash(body.password, salt)}",
                "${salt}",
                "${token}",
                0
            );
        `);
        const hostname = `${req.protocol}://${req.hostname}:${port}`;
        const confirmationUrl = `${hostname}/api/confirm?token=${token}`;
        await mailer.sendConfirmationEmail(body.email.replace(/^'|'$/g, ''), confirmationUrl);
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

api.get('/confirm', async (req, res, next) => {
    try {
        const row = await db.getAsync(`
            SELECT count(*) 
            FROM users 
            WHERE activationToken = ${req.query.token}
        `);

        if (row['count(*)'] !== 1) {
            throw new Error('Could not authenticate user.');
        }

        await db.runAsync(`
            UPDATE users 
                SET active = 1, activationToken = NULL 
            WHERE activationToken = ${req.query.token}
        `);

        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
});

api.post('/login', async (req, res, next) => {
    try {
        const { body } = req;

        const row = await db.getAsync(`
            SELECT salt, password 
            FROM users 
            WHERE username = ${body.username}
        `);

        if (!row) {
            throw new Error('Could not authenticate user');
        }

        const password = getHash(body.password, row.salt);
        if (password !== row.password) {
            throw new Error('Wrong password.');
        }

        const token = await generateToken();

        await db.runAsync(`
            UPDATE users 
                SET authToken = "${token}"
            WHERE username = ${body.username}
        `);

        res.cookie('auth', token, {
            httpOnly: true,
            // secure: true
        });
        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(401);
    }
});

api.post('/logout', async (req, res, next) => {
    try {
        await db.runAsync(`
            UPDATE users 
                SET authToken = NULL
            WHERE authToken = ${req.cookies.auth}
        `);

        res.clearCookie('auth');
        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(401);
    }
});

const getUserId = async (authToken) => {
    const row = await db.getAsync(`
        SELECT id
        FROM users 
        WHERE authToken = ${authToken}
    `);

    return row ? row.id : null;
};

api.post('/passwords', async (req, res, next) => {

    try {
        const { body, cookies } = req;

        if (!cookies.auth) {
            return res.sendStatus(401);
        }

        const userId = await getUserId(cookies.auth);

        if (!userId) {
            return res.sendStatus(401);
        }

        await db.runAsync(`
            INSERT INTO passwords (site, site_username, site_password, user_id)
            VALUES (
                ${body.site || 'NULL'},
                ${body.site_username || 'NULL'},
                ${body.site_password || 'NULL'},
                ${userId}
            )
        `);

        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }

});

api.get('/passwords/search', async (req, res, next) => {
    try {
        const userId = await getUserId(req.cookies.auth);

        if (!userId) {
            return res.sendStatus(401);
        }

        const rows = await db.allAsync(`
            SELECT 
                site,
                site_username,
                site_password
            FROM passwords 
            WHERE 
                user_id = ${userId} AND
                site = ${req.query.site}
        `);

        res.send(rows);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
});

module.exports = api;