let cookies;

// magic cookie reader from https://stackoverflow.com/questions/5639346/what-is-the-shortest-function-for-reading-a-cookie-by-name-in-javascript
export function readCookie(name, c?, C?, i?) {
    if (cookies) { return cookies[name]; }

    c = document.cookie.split('; ');
    cookies = {};

    for (i = c.length - 1; i >= 0; i--) {
        C = c[i].split('=');
        cookies[C[0]] = C[1];
    }

    return cookies[name];
}