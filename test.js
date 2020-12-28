require("dotenv").config();
const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
// console.log('sending mail')
// transporter.sendMail({
//     from: process.env.EMAIL_USER,
//     to: 'johnnyqu4@gmail.com',
//     subject: "fuck u",
//     text: 'xd'
// });
const db = require('knex')({
    client: 'sqlite3',
    connection: {
        filename: process.env.DB_PATH
    },
    useNullAsDefault: true // so we can avoid sqlite specific bugs
});

db('Accounts').where('email', 'bertsunjc@gmail.com').del().then(console.log());