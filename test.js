require("dotenv").config();
const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});
console.log('sending mail')
transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'johnnyqu4@gmail.com',
    subject: "fuck u",
    text: 'xd'
});