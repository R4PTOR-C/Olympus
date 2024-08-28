const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'olympusgymapp@gmail.com',
        pass: 'ndfi llcd tqqm gdos',
    },
});

const mailOptions = {
    from: 'olympusgymapp@gmail.com',
    to: 'rafaelcroriz7@gmail.com', // Substitua pelo seu e-mail
    subject: 'Teste de Nodemailer',
    text: 'Este é um e-mail de teste enviado pelo Nodemailer.',
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log('Erro ao enviar e-mail:', error);
    }
    console.log('E-mail enviado:', info.response);
});