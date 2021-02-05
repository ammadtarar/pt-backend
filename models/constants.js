const { mode } = require("crypto-js");

module.exports.JOB_REFERRAL_STAGES = [
    'candidate_referred',
    'application_received',
    'undergoing_interview',
    'candidate_selected'
];

module.exports.COMPANY_USER_TYPES = [
    'hr_admin',
    'employee'
];

module.exports.JOB_REFERRAL_SUCCESS_REWARD_TYPES = [
    'points',
    'cash'
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
    'incoming',
    'outgoing'
]