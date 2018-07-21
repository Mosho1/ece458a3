const sqlite3 = require('sqlite3').verbose();
const { existsSync } = require('fs');
const { promisifyAll } = require('bluebird');

const dbFile = './db.sqlite3';

const alreadyExists = dbFile !== ':memory:' && existsSync(dbFile);

const db = promisifyAll(new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE));

const dbPrepare = db.prepare
db.prepare = function (...args) {
    const stmt = dbPrepare.apply(this, args);
    return promisifyAll(stmt);
};

if (!alreadyExists) {
    db.serialize(() => {
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
    });
}



module.exports = db;