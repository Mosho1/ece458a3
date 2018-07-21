const asmcrypto = require('asmcrypto.js');
const crypto = require('crypto');

const getPbkdf2Hash = (str, salt, count = 4096, dklen = 64) => {
    return asmcrypto.bytes_to_hex(
        asmcrypto.Pbkdf2HmacSha512(
            asmcrypto.string_to_bytes(str),
            asmcrypto.string_to_bytes(salt),
            count,
            dklen
        )
    );
};

const generateToken = (length = 24) =>
    new Promise((resolve, reject) => crypto.randomBytes(length, function (err, buffer) {
        if (err) reject(err)
        else resolve(buffer.toString('hex'));
    }));

const encrypt = key => async clearText => {
    // delay invocations, for some reason it makes the result invalid
    await new Promise(res => setTimeout(res));
    key = getPbkdf2Hash(key, key, 1, 16);
    const nonce = await generateToken(8);
    const encrypted = asmcrypto.AES_GCM.encrypt(
        asmcrypto.string_to_bytes(clearText),
        asmcrypto.string_to_bytes(key),
        asmcrypto.hex_to_bytes(nonce)
    );
    return nonce + asmcrypto.bytes_to_hex(encrypted);
};

const decrypt = key => value => {
    key = getPbkdf2Hash(key, key, 1, 16);
    const nonce = value.slice(0, 16);
    const cipherText = value.slice(16);
    return asmcrypto.bytes_to_string(asmcrypto.AES_GCM.decrypt(
        asmcrypto.hex_to_bytes(cipherText),
        asmcrypto.string_to_bytes(key),
        asmcrypto.hex_to_bytes(nonce),
    ));
};

const generateTokenWithExpiry = async (expiryInMs = 1000 * 60 * 60, length = 24) => {
    return (Number(new Date()) + expiryInMs) + await generateToken();
};

const didTokenExpire = (token) => {
    return Number(new Date()) > Number(token.slice(0, 13));
};

const validateHexToken = token => token.match(/^[a-z0-9]+$/i);

module.exports = {
    getPbkdf2Hash,
    generateToken,
    encrypt,
    decrypt,
    generateTokenWithExpiry,
    didTokenExpire,
    validateHexToken
};

