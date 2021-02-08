const nodemailer = require("nodemailer");
const { reject } = require("underscore");

var handlebars = require('handlebars');
var fs = require('fs');

var readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
            callback(err);
        }
        else {
            callback(null, html);
        }
    });
};



let transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 465,
    secure: true,
    auth: {
        user: "apikey",
        pass: "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"
    }
});


async function sendCompanyUserOtp(email, otp , first_name) {
    new Promise((resolve, reject) => {
        readHTMLFile(__dirname + '/../htmls/otp_email.html', function(err, html) {
            transporter.sendMail({
                from: '"PushTalents" <no-reply@pushtalent.com>',
                to: email,
                subject: 'PushTalents Login OTP || OTP de connexion PushTalents',
                html:handlebars.compile(html)({
                    otp: otp,
                    candidate : first_name
                })
            })
            .then(success => {
                resolve(success);
            })
            .catch(err => {
                reject(err)
            });
        });
});

};

async function sendJobReferral(candidate, employee , referralUrl) {
    new Promise((resolve, reject) => {
            readHTMLFile(__dirname + '/../htmls/referral_email.html', function(err, html) {
                transporter.sendMail({
                    from: '"PushTalents" <no-reply@pushtalent.com>',
                    to: candidate.email,
                    subject: employee.first_name + " referred you for a job",
                    html:handlebars.compile(html)({
                        url: referralUrl,
                        candidate : candidate.first_name,
                        employee : employee.first_name
                    })
                })
                .then(success => {
                    resolve(success);
                })
                .catch(err => {
                    reject(err)
                });
            });
    });
};




module.exports.sendCompanyUserOtp = sendCompanyUserOtp;
module.exports.sendJobReferral = sendJobReferral;
