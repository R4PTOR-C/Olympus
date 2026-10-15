// Script manual de teste do envio de e-mail: `node email.js destino@exemplo.com`
// Usa as credenciais do ambiente (EMAIL_USER / EMAIL_PASS), nunca do código.
require('dotenv').config();
const { enviarEmail } = require('./config/email');

const destino = process.argv[2];
if (!destino) {
    console.error('Uso: node email.js destino@exemplo.com');
    process.exit(1);
}

enviarEmail({
    to: destino,
    subject: 'Teste de Nodemailer',
    text: 'Este é um e-mail de teste enviado pelo Nodemailer.',
})
    .then(info => console.log('E-mail enviado:', info.response))
    .catch(err => console.log('Erro ao enviar e-mail:', err.message));
