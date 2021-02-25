require('custom-env').env(true)
const Sequelize = require('sequelize');
const { lastIndexOf } = require('underscore');


var sequelize;
console.log("process.env.NODE_ENV = ", process.env.NODE_ENV);
if (process.env.NODE_ENV == 'development') {
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USERNAME,
        process.env.DB_PASSWORD, {
            dialect: process.env.DB_DIALECT,
            storage: process.env.DB_FILE_PATH,
            operatorsAliases: false,
            logging: true
        });
} else {
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USERNAME,
        process.env.DB_PASSWORD, {
            host: process.env.DB_HOST,
            dialect: process.env.DB_DIALECT,
            port: process.env.DB_PORT,
            logging: true
        });
}


var db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Op = Sequelize.Op;

db.super_admin = sequelize.import('../models/super_admin.js');
let company = sequelize.import('../models/company.js');
db.company = company;

db.user = sequelize.import('../models/user/user.js');
db.user.belongsTo(db.company);
db.company.hasMany(db.user , { as : 'users'});

db.otp = sequelize.import('../models/otp.js');
db.otp.belongsTo(db.user);

db.job = sequelize.import('../models/jobs/job.js');
db.candidate = sequelize.import('../models/jobs/candidate.js');
db.job_referral = sequelize.import('../models/jobs/job_referral.js');
db.job_share = sequelize.import('../models/jobs/job_share.js');
db.settings = sequelize.import('../models/settings.js');

db.job.belongsTo(db.company);
db.job_referral.belongsTo(db.job , {as : 'job'});
db.job_referral.belongsTo(db.company);
db.job.hasMany(db.job_referral , {as : 'referrals'});
db.job_referral.belongsTo(db.user , { as : 'employee'});
db.job_referral.belongsTo(db.candidate);
db.job_share.belongsTo(db.user , { as : 'employee'});
db.job_share.belongsTo(db.job);

db.article = sequelize.import('../models/articles/article.js');
db.article_share = sequelize.import('../models/articles/article_share.js');
db.article.belongsTo(db.company);
db.article_share.belongsTo(db.article);
db.article_share.belongsTo(db.user , { as : 'employee'});

db.quiz = sequelize.import('../models/quizzes/quiz.js');
db.quiz_item = sequelize.import('../models/quizzes/quiz_item.js');
db.quiz_test = sequelize.import('../models/quizzes/quiz_test.js');
db.quiz.hasMany(db.quiz_item , { as : 'questions'});
db.quiz_test.belongsTo(db.quiz);
db.quiz_test.belongsTo(db.user , { as : 'employee'});

db.reward = sequelize.import('../models/rewards/reward.js');
db.reward_redemption_request = sequelize.import('../models/rewards/reward_redemption_request.js');
db.reward.belongsTo(db.company);
db.reward.belongsTo(db.user , { as : 'hr'});
db.reward_redemption_request.belongsTo(db.reward);
db.reward_redemption_request.belongsTo(db.user , { as : 'employee'});
db.reward_redemption_request.belongsTo(db.company);

db.wallet_transaction = sequelize.import('../models/user/wallet_transaction.js');
db.wallet_transaction.belongsTo(db.user);
db.wallet_transaction.belongsTo(db.article_share , { foreignKey  : { as : 'source'}});
db.wallet_transaction.belongsTo(db.job_referral , { foreignKey  : { as : 'source'}});
db.wallet_transaction.belongsTo(db.reward_redemption_request , { foreignKey  : { as : 'source'}});


module.exports = db;