# Running the app

1. Install node
1. `npm i`
1. Environment variables `EMAIL_ACCOUNT` and `EMAIL_PASSWORD` need to be set or sending email (for registration, forgot password) won't work. If it's a gmail account, it needs to have "Allow less secure apps" enabled.
1. `npm start` / `npm run build-browser && npm run serve` for a development / production version.
1. go to `localhost:3001`


# Note

I realize this may be beyond the planned scope of the assignment, however I enjoyed learning about security and cryptography, and I also enjoy making web apps. So I thought I'd go the extra mile :)

# Overview

The web app implements all requirements (1-6). There's no pseudocode, the code is available at <https://git.uwaterloo.ca/srolel/ece-458-a3> (and a private GitHub repository that I deploy from), and It's also included in this submission.

A running instance of the app is available at <https://ece458a3.srolel.com>. You can sign up with a confirmable email, and there's also a user "demo" with password "demo".

# List of defenses

Defensive measures taken according to OWASP.

## Randomness

All random tokens are generated using:

```typescript
// from webpack/crypto.js
const generateToken = (length = 24) =>
    new Promise((resolve, reject) => crypto.randomBytes(length, function (err, buffer) {
        if (err) reject(err)
        else resolve(buffer.toString('hex'));
    }));
```

Specifically `require('crypto').randomBytes`, which is a native NodeJS implementation of crypto algorithms, and randomness relies on system entropy using `/dev/urandom`. The app includes the (semi-official) browser implementation of this library from encryption, but without access to the system on users' machines, I don't know how close the randomness is to the Node implementation. It is, however, as close as possible.

## Session management

Secure, HttpOnly, SameSite and MaxAge (1 hour) are used for the cookie. Domain value is set to the hostname including subdomain by default.

TLS is used for all communication, with a 301 redirect from http to https.

The session cookie name is random, and only a hash of the cookie is saved in the database.

Cookies are set using:

```typescript
// from webpack/api.js
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

```typescript
// from webpack/api.js
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

All url params and GET request bodies are escaped using:

```typescript
// from webpack/api.js
for (const field of ['body', 'query']) {
    for (let k in req[field]) {
        req[field][k] = unquote(escape(req[field][k]));
    }
}
```

All database queries are built using `db.prepare`.

## Hashing

Usernames and passwords are hashed using PBKDF2 - slower than SHA by design to increase work that needs to be done by an attacker, while having no real consequence for the user (who only has to do it once).

```typescript
// from webpack/crypto.js
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

```typescript
// from webpack/crypto.js

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

1. The database can be secured using specific database users per api endpoint that can only access the relevant data, to limit the potential consequences of SQL injection.

1. Automatically logging the user out after a period of inactivity.

# Implementation details

I provide an overview of the features below, as well as the technologies used. However, there are many implementation details that are not included here, but are in the code, such as the views, and error handling.

The initial boilerplate was cloned from <https://github.com/mobxjs/react-mobx-boilerplate> (which I also wrote).

The backend was implemented from scratch.

The following technologies were used:

## Backend

1. NodeJS - JS runtime
1. Express - web server framework
1. nodemailer - used to send emails using a gmail smtp
1. node sqlite3 - sqlite implementation for Node
1. AWS - hosting, domain, TLS certificate, load balancer
1. nginx - reverse proxy from the load balancer to the app

## Frontend

1. React - view library
1. Mobx - state management
1. TypeScript - typed JavaScript language
1. Material-UI - React components based on Google's material design

## Shared

1. asmcrypto.js - crypto algorithm implementations

## Database

### Schema

```typescript
// from webpack/db.js
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

1. `webpack/api.js` includes all the backend endpoints. A 401 status is sent back to the client if an unauthorized attempt to access an endpoint occurs, and a 400 status is sent if anything else went wrong. All endpoints accept only POST requests.

1. `stores/AppState.ts` includes all calls to those endpoints from the frontend.

1. `Components/*.tsx` includes the view files for each page. Most of the components are forms and use `Form.tsx` which implements a submit button with a loader, as well as success error messages. The view React templates are quite verbose so I won't include them in the report, but they are in the attached code for the app (in each view component class' `render` method, in addition to all other view functionalities). In addition to the success/error messages and loader, I tried to make for a nice UX, with a Material-UI layout, colors, fonts and animations.

### Sign up / Register

In addition to the username, password and email, the user also needs to enter the password again to verify it, with an error message if there is a mismatch.

#### Database Query

```typescript
// from webpack/api.js
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

After registration, a token is generated and an email is sent to the user with a link to the `/confirm` page, with the token as a url parameter. It is then validated in the client and sent to the backend, which checks the token and sets the account status to active and clears the token. The UI shows the user feedback (success/failure).

#### Database Query

```typescript
// from webpack/api.js
db.prepare(`
    UPDATE users 
        SET active = 1, activationToken = NULL 
    WHERE activationToken = ?
`).runAsync(req.body.token);
```

The view is available in `Confirm.tsx`.

### Log in

The user's password and active status is verified with this query:

```typescript
// from webpack/api.js
db.prepare(`
    SELECT salt, password, active 
    FROM users 
    WHERE username = ?
`).getAsync(body.username);
```

And then the auth token is issued and set as a cookie.

```typescript
// from webpack/api.js
db.prepare(`
    UPDATE users 
    SET authToken = ?
    WHERE username = ?
`).runAsync(getPbkdf2Hash(token, cookieSalt), body.username);
```

The view is available in `Login.tsx`.

### Forgot Password

A random hex token with an expiry date (default 1 hour) is generated using:

```typescript
// from webpack/crypto.js
const generateTokenWithExpiry = async (expiryInMs = 1000 * 60 * 60, length = 24) => {
    return (Number(new Date()) + expiryInMs) + await generateToken();
};

const didTokenExpire = (token) => {
    return Number(new Date()) > Number(token.slice(0, 13));
};
```

An email is sent (from a proprietary gmail account) to the user with a link that includes the token, and the user will be prompted to choose a new password in the page it leads to (the token is validated on the client side).

The code for the view is in `Forgot.tsx` and `Recover.tsx`.

### Add site/password

This page is accessed using the round `+` on the bottom right, and the user is also directed to this page after a successful login.

#### Database Query

```typescript
// from webpack/api,.js
await db.prepare(`
    INSERT INTO passwords (site, site_username, site_password, user_id)
    VALUES (?, ?, ?, ?)
`).runAsync(
    body.site,
    body.site_username,
    body.site_password,
    userId
);
```

The view is available in `Add.tsx`.

### Search site (Retrieve password)

The search bar occupies most of the top bar, hard to miss. Upon entering a term and pressing enter, the user will be directed to a page with a table that will list all matches. 

There are 3 columns (site name, username, password), and the password is not visible unless the "show" button is clicked. There is also a button that allows a user to copy the password to their clipboard.

This deviates a little from the specification, but I think allowing users to enter multiple users for a single site is desirable (I often do). The only attack vector (that I could think of or research) is access to the browser developer tools, and also browser itself since there is no way (again, that I could think of or find through research) to invoke any functions in the app's code from the console. 

That means unfettered remote or physical access to the user's computer. That also means the user's master password is readable by the attacker. The only way to protect the user from this is not storing anything in memory, other than a brief instant when a retrieved encrypted value from the server is decrypted. 

That is, having the user input the password on every decryption.

#### Database Query

```typescript
// from webpack/api.js
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

# Deployment

Hosting, the domain and TLS certificate are provided with a free-tier AWS account.

The deployment script is `deploy.sh`, and the Dockerfile is in... `Dockerfile`. 

Continuous deployment is set up using GitHub webhooks with a modest CI server I wrote, available at https://github.com/Mosho1/ci.