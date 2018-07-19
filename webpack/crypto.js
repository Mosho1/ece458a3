const crypto = require('asmcrypto.js');

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

const generateToken = () =>
    new Promise((resolve, reject) => require('crypto').randomBytes(24, function (err, buffer) {
        if (err) reject(err)
        else resolve(buffer.toString('hex'));
    }));


module.exports = {
    getPbkdf2Hash,
    generateToken
};
