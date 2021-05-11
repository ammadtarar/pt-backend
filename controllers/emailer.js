const nodemailer = require("nodemailer");
const { reject } = require("underscore");

var handlebars = require("handlebars");
var fs = require("fs");
const { mode } = require("crypto-js");

const fetch = require("node-fetch");

var readHTMLFile = function (path, callback) {
  fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
    if (err) {
      throw err;
      callback(err);
    } else {
      callback(null, html);
    }
  });
};

// let transporter = nodemailer.createTransport({
//   host: "smtp.sendgrid.net",
//   port: 465,
//   secure: true,
//   auth: {
//     user: "apikey",
//     pass:
//       "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",
//   },
// });

let transporter = nodemailer.createTransport({
  host: "email-smtp.eu-west-1.amazonaws.com",
  port: 465,
  secure: true,
  auth: {
    user: "AKIASJLIZV4CMY6KHZFY",
    pass: "BEjLg3R+mxfDBlu89vsU3rmuAgNWzMrBpL0kIa19FzWe",
  },
});

async function sendCompanyUserOtp(otp, user) {
  console.log("OTP = ", otp);
  console.log("USER = ", user);
  new Promise((resolve, reject) => {
    readHTMLFile(__dirname + "/../htmls/otp_email.html", function (err, html) {
      transporter
        .sendMail({
          from: '"PushTalents" <no-reply@pushtalents.com>',
          to: user.email,
          subject: "Votre code personnel PUSHTALENTS",
          attachments: [
            {
              filename: "logo.png",
              path: __dirname + "/logo.png",
              cid: "logo",
            },
          ],
          html: handlebars.compile(html)({
            code: otp,
            candidate: `${user.first_name} ${user.last_name}`,
            company: user.company.name,
          }),
        })
        .then((success) => {
          console.log("email send success");
          console.log(success);
          resolve(success);
        })
        .catch((err) => {
          console.log("email send fail");
          console.log(err);
          reject(err);
        });
    });
  });
}

async function sendHrOtp(otp, user) {
  console.log("OTP = ", otp);
  console.log("USER = ", user);
  new Promise((resolve, reject) => {
    readHTMLFile(
      __dirname + "/../htmls/hr_otp_email.html",
      function (err, html) {
        transporter
          .sendMail({
            from: '"PushTalents" <no-reply@pushtalents.com>',
            to: user.email,
            subject: "Votre code personnel d'Administration PUSHTALENTS",
            attachments: [
              {
                filename: "logo.png",
                path: __dirname + "/logo.png",
                cid: "logo",
              },
            ],
            html: handlebars.compile(html)({
              code: otp,
              user: `${user.first_name} ${user.last_name}`,
            }),
          })
          .then((success) => {
            console.log("email send success");
            console.log(success);
            resolve(success);
          })
          .catch((err) => {
            console.log("email send fail");
            console.log(err);
            reject(err);
          });
      }
    );
  });
}

async function sendJobReferral(candidate, employee, referralUrl) {
  new Promise((resolve, reject) => {
    readHTMLFile(
      __dirname + "/../htmls/referral_email.html",
      function (err, html) {
        transporter
          .sendMail({
            from: '"PushTalents" <no-reply@pushtalents.com>',
            to: candidate.email,
            subject: "Vous avez été recommandé pour une offre d'emploi !",
            attachments: [
              {
                filename: "logo.png",
                path: __dirname + "/logo.png",
                cid: "logo",
              },
            ],
            html: handlebars.compile(html)({
              url: referralUrl,
              company: employee.company.name,
              employee: `${employee.first_name} ${employee.last_name}`,
              candidate: candidate.first_name,
            }),
          })
          .then((success) => {
            resolve(success);
          })
          .catch((err) => {
            reject(err);
          });
      }
    );
  });
}

async function sendRedeemApprovalEmailToEmployee(employee, reward) {
  new Promise((resolve, reject) => {
    readHTMLFile(
      __dirname + "/../htmls/reward_approval.html",
      function (err, html) {
        transporter
          .sendMail({
            from: '"PushTalents" <no-reply@pushtalents.com>',
            to: employee.email,
            subject: "Your reward request has been approved",
            attachments: [
              {
                filename: "logo.png",
                path: __dirname + "/logo.png",
                cid: "logo",
              },
            ],
            html: handlebars.compile(html)({
              employee: employee.first_name,
              reward: reward.title,
            }),
          })
          .then((success) => {
            resolve(success);
          })
          .catch((err) => {
            reject(err);
          });
      }
    );
  });
}

async function sendRewardRequestToHR(employee, reward, hr) {
  new Promise((resolve, reject) => {
    readHTMLFile(
      __dirname + "/../htmls/reward_request.html",
      function (err, html) {
        transporter
          .sendMail({
            from: '"PushTalents" <no-reply@pushtalents.com>',
            to: hr.email,
            subject: "Reward redeeem request",
            attachments: [
              {
                filename: "logo.png",
                path: __dirname + "/logo.png",
                cid: "logo",
              },
            ],
            html: handlebars.compile(html)({
              hr: hr.first_name,
              reward: reward.title,
              employee: employee.first_name,
            }),
          })
          .then((success) => {
            resolve(success);
          })
          .catch((err) => {
            reject(err);
          });
      }
    );
  });
}

async function sendHrAccountCreationEmail(user, company) {
  new Promise((resolve, reject) => {
    readHTMLFile(
      __dirname + "/../htmls/hr_account_creation.html",
      function (err, html) {
        transporter
          .sendMail({
            from: '"PushTalents" <no-reply@pushtalents.com>',
            to: user.email,
            subject: "Activez votre compte d'Administration PUSHTALENTS",
            attachments: [
              {
                filename: "logo.png",
                path: __dirname + "/logo.png",
                cid: "logo",
              },
            ],
            html: handlebars.compile(html)({
              user: `${user.first_name} ${user.last_name}`,
              company: company.name,
            }),
          })
          .then((success) => {
            saveUserToSendInBlueContactsList(
              user.email,
              user.first_name,
              user.last_name,
              "Hr Admin",
              company.name,
              user.position
            );
            resolve(success);
          })
          .catch((err) => {
            reject(err);
          });
      }
    );
  });
}

async function sendUserAccountCreationEmail(user, company) {
  new Promise((resolve, reject) => {
    readHTMLFile(
      __dirname + "/../htmls/user_account_creation.html",
      function (err, html) {
        transporter
          .sendMail({
            from: '"PushTalents" <no-reply@pushtalents.com>',
            to: user.email,
            subject: "Activez votre compte mobile PUSHTALENTS",
            attachments: [
              {
                filename: "logo.png",
                path: __dirname + "/logo.png",
                cid: "logo",
              },
            ],
            html: handlebars.compile(html)({
              user: user.first_name,
              company: company.name,
            }),
          })
          .then((success) => {
            saveUserToSendInBlueContactsList(
              user.email,
              user.first_name,
              user.last_name,
              "Employee",
              company.name,
              user.position
            );
            resolve(success);
          })
          .catch((err) => {
            reject(err);
          });
      }
    );
  });
}

async function saveUserToSendInBlueContactsList(
  email,
  fname,
  lname,
  type,
  company,
  position
) {
  console.log();
  console.log();
  console.log(
    `Trying to add ${fname} ${lname} (${email}) to SendInBlue contacts list`
  );
  console.log();
  console.log();
  return new Promise((resolve, reject) => {
    fetch("https://api.sendinblue.com/v3/contacts", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key":
          "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",
      },
      body: JSON.stringify({
        attributes: {
          NOM: fname,
          PRENOM: lname,
          TYPE: type,
          COMPANY: company,
          POSITION: position,
        },
        updateEnabled: false,
        email: email,
      }),
    })
      .then((res) => res.json())
      .then((json) => {
        console.log("SEND-IN-BLUE ADD TO CONTACT RESPONE");
        console.log(json);
        resolve(json);
      })
      .catch((err) => {
        console.log("SEND-IN-BLUE ADD TO CONTACT ERROR");
        console.error("error:" + err);
      });
  });
}

module.exports.sendCompanyUserOtp = sendCompanyUserOtp;
module.exports.sendJobReferral = sendJobReferral;
module.exports.sendRedeemApprovalEmailToEmployee = sendRedeemApprovalEmailToEmployee;
module.exports.sendRewardRequestToHR = sendRewardRequestToHR;
module.exports.sendUserAccountCreationEmail = sendUserAccountCreationEmail;
module.exports.sendHrAccountCreationEmail = sendHrAccountCreationEmail;
module.exports.sendHrOtp = sendHrOtp;
