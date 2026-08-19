const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_USER
    },
    tls: {
        secure: false,
        ignoreTLS: true,
        rejectUnauthorized: false,
    }

});

function enviarEmail(to, subject, text=null, html = null, callback) {

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject
    };
    if(text!= null){
        mailOptions.text = text;
    }else if(html != null){
        
    }
}