const nodemailer = require('nodemailer');
const { promisifyAll } = require('bluebird');

const smtpConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env['EMAIL_ACCOUNT'],
        pass: process.env['EMAIL_PASSWORD']
    }
};

const transporter = promisifyAll(nodemailer.createTransport(smtpConfig));

transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
    } else {
        console.log('Server is ready to take our messages');
    }
});

const sendConfirmationEmail = (email, confirmationUrl) => {
    return transporter.sendMailAsync({
        from: 'admin@srolel.com',
        to: email,
        subject: 'Confirm registration',
        text: `Please confirm your registration using this link: ${confirmationUrl}`,
    });
};

const sendRecoveryEmail = (email, recoveryUrl) => {
    return transporter.sendMailAsync({
        from: 'admin@srolel.com',
        to: email,
        subject: 'Recover password',
        text: `Please use this link to reset your password: ${recoveryUrl}`,
    });
};

module.exports = {
    sendConfirmationEmail,
    sendRecoveryEmail
};