// const nodemailer = require('nodemailer');
const transporter = require('../configs/nodemailer')

// Function to send verification email
const sendVerificationEmail = async (email, verificationToken) => {
    try {
        await transporter.sendMail({
            from: process.env.SENDGRID_EMAIL,
            to: email,
            subject: "Peworld Account - Email Verification",
            text: `Please click on the following link to verify your email: ${process.env.SITE}/auth/verify?token=${verificationToken}`, // plain text body
            html: `<p>Please click <a href="${process.env.SITE}/auth/verify?token=${verificationToken}">here</a> to verify your email</p>`, // html body
          });

        console.log('Email sent');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Function to send reset email
const sendResetEmail = async (email, resetCode) => {
    try {
        await transporter.sendMail({
            from: process.env.SENDGRID_EMAIL,
            to: email,
            subject: "Peworld Account - Password Reset",
            text: `Your password reset code is: ${resetCode}`,
            html: `<p>Your password reset code is: <strong>${resetCode}</strong></p>`,
        });

        console.log('Reset email sent');
    } catch (error) {
        console.error('Error sending reset email:', error);
    }
};

module.exports = {
    sendVerificationEmail,
    sendResetEmail,
};
