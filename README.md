# List of defenses

## Session management

Secure, HttpOnly, SameSite and MaxAge (1 hour) are used. Domain value is set to the hostname including subdomain by default.

TLS is used for all communication, with a 301 redirect from http to https.

## XSS

Since React is used, all generated HTML is sanitized by default. React only allows un-sanitized strings in HTML using `dangerouslySetInnerHTML`, which we don't do.

The header `Content-Type: application/json;` is set on all requests/responses.

Tokens from url params are verified using a regex.

## CSRF

A CSRF synchronization token is used, in addition to the SameSite flag for the cookies.

## SQL injection

All url params and GET request bodies are escaped.

All database queries are built using `db.prepare`.

## Hashing

Usernames and passwords are hashed using PBKDF2 - slower than SHA by design to increase work that needs to be done by an attacker, while having no real consequence for the user (who only has to do it once).

## Encryption

AES-GCM is used on the client-side to encrypt site usernames and passwords. A random nonce is used. Only the encrypted values are ever transmitted to the server.

## Other defenses

SSH access is blocked through AWS security groups

The app runs in a docker container with an almost completely non-privileged user. The app is started with PID 1, and if stopped will exit completely.

The master password is saved in the context of a module and can't be read from the global context, in case the user executes malicious code in the console or runs an external script in the page. The only way to see it is to inspect the browser's memory or set a breakpoint in the developer's tools.