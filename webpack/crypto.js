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

const generateToken = (length = 24) =>
    new Promise((resolve, reject) => require('crypto').randomBytes(length, function (err, buffer) {
        if (err) reject(err)
        else resolve(buffer.toString('hex'));
    }));

const encrypt = key => async clearText => {
    await new Promise(res => setTimeout(res));
    key = getPbkdf2Hash(key, key, 1, 16);
    const nonce = Date.now().toString();
    const encrypted = crypto.bytes_to_string(crypto.AES_GCM.encrypt(
        crypto.string_to_bytes(clearText),
        crypto.string_to_bytes(key),
        crypto.string_to_bytes(nonce.toString()),
    ));
    return nonce + new TextEncoder('utf-8').encode(encrypted);
};

const decrypt = key => value => {
    key = getPbkdf2Hash(key, key, 1, 16);
    const nonce = value.slice(0, 13);
    const valueArray = new Uint8Array(value.slice(13).split(','));
    const cipherText = new TextDecoder('utf-8').decode(valueArray);
    return crypto.bytes_to_string(crypto.AES_GCM.decrypt(
        crypto.string_to_bytes(cipherText),
        crypto.string_to_bytes(key),
        crypto.string_to_bytes(nonce.toString()),
    ));
};

module.exports = {
    getPbkdf2Hash,
    generateToken,
    encrypt,
    decrypt
};
