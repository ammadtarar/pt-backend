const nodemailer = require("nodemailer");
const { reject } = require("underscore");

var handlebars = require('handlebars');
var fs = require('fs');
const { mode } = require("crypto-js");

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


async function sendRedeemApprovalEmailToEmployee(employee, reward) {
    new Promise((resolve, reject) => {
            readHTMLFile(__dirname + '/../htmls/reward_approval.html', function(err, html) {
                transporter.sendMail({
                    from: '"PushTalents" <no-reply@pushtalent.com>',
                    to: employee.email,
                    subject: "Your reward request has been approved",
                    html:handlebars.compile(html)({
                        employee: employee.first_name,
                        reward : reward.title
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


async function sendRewardRequestToHR(employee, reward , hr) {
    new Promise((resolve, reject) => {
            readHTMLFile(__dirname + '/../htmls/reward_request.html', function(err, html) {
                transporter.sendMail({
                    from: '"PushTalents" <no-reply@pushtalent.com>',
                    to: hr.email,
                    subject: "Reward redeeem request",
                    html:handlebars.compile(html)({
                        hr: hr.first_name,
                        reward : reward.title,
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

async function sendHrAccountCreationEmail(user , company) {
    new Promise((resolve, reject) => {
            readHTMLFile(__dirname + '/../htmls/hr_account_creation.html', function(err, html) {
                transporter.sendMail({
                    from: '"PushTalents" <no-reply@pushtalent.com>',
                    to: user.email,
                    subject: "Your PushTalents Acccount Created",
                    html:handlebars.compile(html)({
                        user : user.first_name,
                        company : company.name
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

async function sendUserAccountCreationEmail(user , company) {
    new Promise((resolve, reject) => {
            readHTMLFile(__dirname + '/../htmls/user_account_creation.html', function(err, html) {
                transporter.sendMail({
                    from: '"PushTalents" <no-reply@pushtalent.com>',
                    to: user.email,
                    subject: "Your PushTalents Acccount Created",
                    html:handlebars.compile(html)({
                        user : user.first_name,
                        company : company.name
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
module.exports.sendRedeemApprovalEmailToEmployee = sendRedeemApprovalEmailToEmployee;
module.exports.sendRewardRequestToHR = sendRewardRequestToHR;
module.exports.sendUserAccountCreationEmail = sendUserAccountCreationEmail;
module.exports.sendHrAccountCreationEmail = sendHrAccountCreationEmail;

