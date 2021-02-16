const { mode } = require("crypto-js");

const CONSTANTS = {
    POINTS : 'points',
    CASH : 'cash',
    INCOMING : 'incoming',
    OUTGOING : 'outgoing',
    ARTICLE_CLICK : 'article_click',
    JOB_REFERRAL : 'job_referral',
    REWARD_CLAIM : 'reward_claim',
    CANDIDATE_REFERRED : 'candidate_referred',
    APPLICATION_RECEIVED: 'application_received',
    UNDERGOING_INTERVIEW : 'undergoing_interview',
    CANDIDATE_SELECTED : 'candidate_selected',
    REQUESTED : 'requested',
    APPROVED : 'approved',
    HR_ADMIN : 'hr_admin',
    EMPLOYEE : 'employee',
    OPTION_ONE : 'option_one',
    OPTION_TWO : 'option_two',
    OPTION_THREE : 'option_three',
    EASY : 'easy',
    MEDIUM : 'medium',
    DIFFICULT : 'difficult',
    IN_PROGRESS : 'in_progress',
    COMPLETED : 'completed',
    ACTIVE : 'active',
    ARCHIVED : 'archived'
}


module.exports.CONSTANTS = CONSTANTS;

module.exports.JOB_REFERRAL_STAGES = [
    CONSTANTS.CANDIDATE_REFERRED,
    CONSTANTS.APPLICATION_RECEIVED,
    CONSTANTS.UNDERGOING_INTERVIEW,
    CONSTANTS.CANDIDATE_SELECTED
];

module.exports.COMPANY_USER_TYPES = [
    CONSTANTS.HR_ADMIN,
    CONSTANTS.EMPLOYEE
];

module.exports.JOB_REFERRAL_SUCCESS_REWARD_TYPES = [
    CONSTANTS.POINTS,
    CONSTANTS.CASH
];

module.exports.REWARD_TRANSACTION_SOURCE_TYPES = [
    CONSTANTS.ARTICLE_CLICK,
    CONSTANTS.JOB_REFERRAL,
    CONSTANTS.REWARD_CLAIM
];

module.exports.QUIZ_DIFFICULTY_LEVELS = [
    CONSTANTS.EASY,
    CONSTANTS.MEDIUM,
    CONSTANTS.DIFFICULT
];

module.exports.REWARD_REDEMPTION_STAUSES = [
    CONSTANTS.REQUESTED,
    CONSTANTS.APPROVED
];

module.exports.WALLET_ACTIVITY_TYPE = [
    CONSTANTS.INCOMING,
    CONSTANTS.OUTGOING
]

module.exports.QUIZ_ANSWERS = [
    CONSTANTS.OPTION_ONE,
    CONSTANTS.OPTION_TWO,
    CONSTANTS.OPTION_THREE
]

module.exports.QUIZ_STAGES = [
    CONSTANTS.IN_PROGRESS,
    CONSTANTS.COMPLETED
]

module.exports.USER_STATUSES = [
    CONSTANTS.ACTIVE,
    CONSTANTS.ARCHIVED
]