const nodemailer = require("nodemailer");
const { reject } = require("underscore");

let transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 465,
    secure: true,
    auth: {
        user: "apikey",
        pass: "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"
    }
});


async function sendCompanyUserOtp(email, otp) {
    new Promise((resolve, reject) => {
        transporter.sendMail({
                from: '"MYBarre" <no-reply@pushtalent.com>',
                to: email,
                subject: "PushTalents Login OTP || OTP de connexion PushTalents",
                text: 'Please use ' + otp + ' to login to PushTalent\n' + 'Veuillez utiliser' + otp + 'pour vous connecter à PushTalent' 
            })
            .then(success => {
                resolve();
            })
            .catch(err => {
                console.log();
                console.log("========= sendUserStatusUpdateEmail ERROR =========");
                console.log(err);
                console.log("===================================================");
                console.log();
                reject(err)
            })
    });
};

module.exports.sendCompanyUserOtp = sendCompanyUserOtp;