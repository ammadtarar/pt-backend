const { mode } = require("crypto-js");

const CONSTANTS = {
    POINTS : 'points',
    CASH : 'cash',
    INCOMING : 'incoming',
    OUTGOING : 'outgoing',
    ARTICLE_CLICK : 'article_click',
    JOB_REFERRAL : 'job_referral',
    CANDIDATE_REFERRED : 'candidate_referred',
    APPLICATION_RECEIVED: 'application_received',
    UNDERGOING_INTERVIEW : 'undergoing_interview',
    CANDIDATE_SELECTED : 'candidate_selected'


}


module.exports.CONSTANTS = CONSTANTS;

module.exports.JOB_REFERRAL_STAGES = [
    CONSTANTS.CANDIDATE_REFERRED,
    CONSTANTS.APPLICATION_RECEIVED,
    CONSTANTS.UNDERGOING_INTERVIEW,
    CONSTANTS.CANDIDATE_SELECTED
];

module.exports.COMPANY_USER_TYPES = [
    'hr_admin',
    'employee'
];

module.exports.JOB_REFERRAL_SUCCESS_REWARD_TYPES = [
    CONSTANTS.POINTS,
    CONSTANTS.CASH
];

module.exports.REWARD_TRANSACTION_SOURCE_TYPES = [
    CONSTANTS.ARTICLE_CLICK,
    CONSTANTS.JOB_REFERRAL
];

module.exports.QUIZ_DIFFICULTY_LEVELS = [
    'easy',
    'medium',
    'difficult'
];

module.exports.REWARD_REDEMPTION_STAUSES = [
    'requested',
    'approved'
];

module.exports.WALLET_ACTIVITY_TYPE = [
    CONSTANTS.INCOMING,
    CONSTANTS.OUTGOING
]