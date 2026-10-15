// config/email.js — envio de e-mail (Gmail com senha de app).
// Credenciais vêm do ambiente: EMAIL_USER e EMAIL_PASS.
const nodemailer = require('nodemailer');

const { EMAIL_USER, EMAIL_PASS } = process.env;

const configurado = () => Boolean(EMAIL_USER && EMAIL_PASS);

let transporter = null;
function getTransporter() {
    if (!configurado()) throw new Error('E-mail não configurado (EMAIL_USER / EMAIL_PASS).');
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        });
    }
    return transporter;
}

const enviarEmail = ({ to, subject, text }) =>
    getTransporter().sendMail({ from: EMAIL_USER, to, subject, text });

module.exports = { enviarEmail, configurado };
