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

var myvar = 'body {'+
'			margin: 0;'+
'			padding: 0;'+
'		}'+
''+
'		table,'+
'		td,'+
'		tr {'+
'			vertical-align: top;'+
'			border-collapse: collapse;'+
'		}'+
''+
'		* {'+
'			line-height: inherit;'+
'		}'+
''+
'		a[x-apple-data-detectors=true] {'+
'			color: inherit !important;'+
'			text-decoration: none !important;'+
'		}'+
'	'+
''+
'		@media (max-width: 620px) {'+
''+
'			.block-grid,'+
'			.col {'+
'				min-width: 320px !important;'+
'				max-width: 100% !important;'+
'				display: block !important;'+
'			}'+
''+
'			.block-grid {'+
'				width: 100% !important;'+
'			}'+
''+
'			.col {'+
'				width: 100% !important;'+
'			}'+
''+
'			.col_cont {'+
'				margin: 0 auto;'+
'			}'+
''+
'			img.fullwidth,'+
'			img.fullwidthOnMobile {'+
'				max-width: 100% !important;'+
'			}'+
''+
'			.no-stack .col {'+
'				min-width: 0 !important;'+
'				display: table-cell !important;'+
'			}'+
''+
'			.no-stack.two-up .col {'+
'				width: 50% !important;'+
'			}'+
''+
'			.no-stack .col.num2 {'+
'				width: 16.6% !important;'+
'			}'+
''+
'			.no-stack .col.num3 {'+
'				width: 25% !important;'+
'			}'+
''+
'			.no-stack .col.num4 {'+
'				width: 33% !important;'+
'			}'+
''+
'			.no-stack .col.num5 {'+
'				width: 41.6% !important;'+
'			}'+
''+
'			.no-stack .col.num6 {'+
'				width: 50% !important;'+
'			}'+
''+
'			.no-stack .col.num7 {'+
'				width: 58.3% !important;'+
'			}'+
''+
'			.no-stack .col.num8 {'+
'				width: 66.6% !important;'+
'			}'+
''+
'			.no-stack .col.num9 {'+
'				width: 75% !important;'+
'			}'+
''+
'			.no-stack .col.num10 {'+
'				width: 83.3% !important;'+
'			}'+
''+
'			.video-block {'+
'				max-width: none !important;'+
'			}'+
''+
'			.mobile_hide {'+
'				min-height: 0px;'+
'				max-height: 0px;'+
'				max-width: 0px;'+
'				display: none;'+
'				overflow: hidden;'+
'				font-size: 0px;'+
'			}'+
''+
'			.desktop_hide {'+
'				display: block !important;'+
'				max-height: none !important;'+
'			}'+
'		}'+
'	'+
''+
'		@media (max-width: 620px) {'+
'			.icons-inner {'+
'				text-align: center;'+
'			}'+
''+
'			.icons-inner td {'+
'				margin: 0 auto;'+
'			}'+
'		}'+
'	'+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
'Job Referral'+
''+
''+
''+
''+
''+
''+
'{{employee_name}} has referred you for a new job opening. Please click the link below to consult the job and apply oanline'+
''+
''+
''+
''+
''+
'APPLY NOW'+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
'About us  |  Contact us  |  Unsubscribe'+
'Copyright@2020 - email Template, All rights reserved'+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
''+
'Designed with BEE';
	


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

async function sendCompanyUserOtp(candidate, employee , referralUrl) {
    console.log("referralUrl = referralUrl");
    new Promise((resolve, reject) => {
        






            
            console.log();
            console.log();
            console.log("__dirname = " , __dirname);
            console.log();
            console.log();

            readHTMLFile(__dirname + '/../htmls/referral_email.html', function(err, html) {
                var template = handlebars.compile(html);
                var replacements = {
                    url: referralUrl,
                    candidate : candidate.first_name,
                    employee : employee.first_name
                };
                var htmlToSend = template(replacements);


                transporter.sendMail({
                    from: '"MYBarre" <no-reply@pushtalent.com>',
                    to: candidate.email,
                    subject: employee.first_name + " referred you for a job",
                    // text: "You have been referred by " + employee.first_name + " – click on that link to consult the job offer and apply online . Link : " + referralUrl
                    html:htmlToSend
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
                });



                // var mailOptions = {
                //     from: 'my@email.com',
                //     to : 'some@email.com',
                //     subject : 'test subject',
                //     html : htmlToSend
                //  };
                // smtpTransport.sendMail(mailOptions, function (error, response) {
                //     if (error) {
                //         console.log(error);
                //         callback(error);
                //     }
                // });
            });




    });
};




module.exports.sendCompanyUserOtp = sendCompanyUserOtp;
module.exports.sendCompanyUserOtp = sendCompanyUserOtp;

