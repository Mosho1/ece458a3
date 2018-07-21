# List of defenses

## Session management

Secure, HttpOnly, SameSite and MaxAge (1 hour) are used. Domain value is set to the hostname including subdomain by default.

TLS is used for all communication, with a 301 redirect from http to https.

The session cookie name is random, and only a hash of the cookie is saved in the database.

Cookies are set using:

```
const setCookie = (res, value) => {
    res.cookie(cookieName, value, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
        sameSite: true,
        secure: process.env.NODE_ENV === 'production'
    });
};
```

## XSS

Since React is used, all generated HTML is sanitized by default. React only allows un-sanitized strings in HTML using `dangerouslySetInnerHTML`, which we don't do.

The header `Content-Type: application/json;` is set on all requests/responses.

Tokens from url params are verified using a regex.

## CSRF

A CSRF synchronization token is used, in addition to the SameSite flag for the cookies.

Implemented with:

```
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
```

## SQL injection

All url params and GET request bodies are escaped.

All database queries are built using `db.prepare`.

## Hashing

Usernames and passwords are hashed using PBKDF2 - slower than SHA by design to increase work that needs to be done by an attacker, while having no real consequence for the user (who only has to do it once).

```
// from crypto.js
const getPbkdf2Hash = (str, salt, count = 4096, dklen = 64) => {
    return crypto.bytes_to_hex(
        crypto.Pbkdf2HmacSha512(
            crypto.string_to_bytes(str),
            crypto.string_to_bytes(salt),
            count,
            dklen
        )
    );
};
```

## Encryption

AES-GCM is used on the client-side to encrypt site usernames and passwords. A random nonce is used. Only the encrypted values are ever transmitted to the server.

```
// from crypto.js

const encrypt = key => async clearText => {
    // delay invocations, for some reason it makes the result invalid
    await new Promise(res => setTimeout(res));
    key = getPbkdf2Hash(key, key, 1, 16);
    const nonce = await generateToken(8);
    const encrypted = crypto.AES_GCM.encrypt(
        crypto.string_to_bytes(clearText),
        crypto.string_to_bytes(key),
        crypto.hex_to_bytes(nonce)
    );
    return nonce + crypto.bytes_to_hex(encrypted);
};

const decrypt = key => value => {
    key = getPbkdf2Hash(key, key, 1, 16);
    const nonce = value.slice(0, 16);
    const cipherText = value.slice(16);
    return crypto.bytes_to_string(crypto.AES_GCM.decrypt(
        crypto.hex_to_bytes(cipherText),
        crypto.string_to_bytes(key),
        crypto.hex_to_bytes(nonce),
    ));
};
```

## Other defenses

SSH access is blocked through AWS security groups

The app runs in a docker container with an almost completely non-privileged user. The app is started with PID 1, and if stopped will exit completely (though the sqlite database is started inside the container as well and would be lost in this case, but it is set up that way for simplicity in the assignment only).

All data exists in memory in the browser in the context of an ES6 module (bundled for browsers with webpack) and can't be read from the global context, in case the user executes malicious code in the console or runs an external script in the page. The only way to see it is to inspect the browser's memory or set a breakpoint in the developer's tools.

## Additional possible defenses

The database can be secured using specific database users per api endpoint that can only access the relevant data, to limit the potential consequences of SQL injection.

# Implementation details

The web app implements all requirements (1-6). There's no pseudocode, the code is available at XXXXXXXXX, and a running instance of the app is available at `ece458a3.srolel.com`. The following technologies were used:

## Backend

1. NodeJS - JS runtime
1. Express - web server framework
1. nodemailer - used to send emails using a gmail smtp
1. node sqlite3 - sqlite implementation for Node
1. AWS - hosting, domain, TLS certificate

## Frontend

1. React - view library
1. Mobx - state management
1. TypeScript - typed JavaScript language
1. Material-UI - React components based on Google's material design

## Shared

1. asmcrypto.js - crypto algorithm implementations

The initial boilerplate was cloned from `https://github.com/mobxjs/react-mobx-boilerplate` (which I also wrote).

The backend was implemented from scratch.

## Database

### Schema

```
db.run(`
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        activationToken TEXT,
        recoveryToken TEXT,
        authToken TEXT,
        salt TEXT NOT NULL,
        active BOOLEAN NOT NULL CHECK (active IN (0,1))
    );
`);
db.run(`
    CREATE TABLE passwords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        site TEXT NOT NULL,
        site_username TEXT,
        site_password TEXT,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
`);
```

## Features

1. `api.js` includes all the backend endpoints. A 401 status is sent back to the client if an unauthorized attempt to access an endpoint occurs, and a 400 status is sent if anything else went wrong. All endpoints accept only POST requests.

1. `AppState.ts` includes all calls to those endpoints from the frontend.

1. `Components/*.tsx` includes the view files for each page. Most of the components are forms and use `Form.tsx` which implements a submit button with a loader, as well as success error messages. The view React templates are quite verbose so I won't include them in the report, but they are in the attached code for the app. In addition to the success/error messages and loader, I tried to make for a nice UX, with a Material-UI layout, colors, fonts and animations.

### Sign up / Register

In addition to the username, password and email, the user also needs to enter the password again to verify it, with an error message if there is a mismatch.

#### Database Query

```
db.prepare(`
    INSERT INTO users (username, email, password, salt, activationToken, active) 
    VALUES (?, ?, ?, ?, ?, 0);
`).runAsync(
    body.username,
    body.email,
    getPbkdf2Hash(body.password, salt),
    salt,
    token,
);
```

The view is available in `Register.tsx`.

### Confirm registration

The view is available in `Confirm.tsx`.

### Log in

The user's password and active status is verified with this query:

```
const row = await db.prepare(`
    SELECT salt, password, active 
    FROM users 
    WHERE username = ?
`).getAsync(body.username);
```

And then the auth token is issued and set as a cookie.

```
await db.prepare(`
    UPDATE users 
    SET authToken = ?
    WHERE username = ?
`).runAsync(getPbkdf2Hash(token, cookieSalt), body.username);
```

The view is available in `Login.tsx`.

### Forgot Password

A random hex token with an expiry date (default 1 hour) is generated using:

```
const generateTokenWithExpiry = async (expiryInMs = 1000 * 60 * 60, length = 24) => {
    return (Number(new Date()) + expiryInMs) + await generateToken();
};

const didTokenExpire = (token) => {
    return Number(new Date()) > Number(token.slice(0, 13));
};
```

An email is sent to the user with a link that includes the token, and the user will be prompted to choose a new password in the page it leads to (the token is validated on the client side).

The code for the view is in `Forgot.tsx` and `Recover.tsx`.

### Add site/password

This page is accessed using the round `+` on the bottom right, and the user is also directed to this page after a successful login.

#### Database Query

await db.prepare(`
    INSERT INTO passwords (site, site_username, site_password, user_id)
    VALUES (?, ?, ?, ?)
`).runAsync(
    body.site,
    body.site_username,
    body.site_password,
    userId
);

The view is available in `Add.tsx`.

### Search site (Retrieve password)

The search bar occupies most of the top bar, hard to miss.

#### Database Query

```
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
```

The view is available in `Search.tsx`.