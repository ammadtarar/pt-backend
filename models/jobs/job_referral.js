let referral_stages = require('../constants.js').JOB_REFERRAL_STAGES;
module.exports = function(sequelize , DataTypes){
    var job_referral = sequelize.define('job_referral' , {
        stage : {
            type : DataTypes.ENUM(referral_stages),
            values : referral_stages,
            defaultValue : referral_stages[0],
            set(value){
                if (!referral_stages.includes(value)) {
                    throw new EnumValidationError('incorrect referral stage' , 'stage' , referral_stages , value);
                }
                this.setDataValue('stage', value);
            }
        }
    });
    return job_referral;
};

module.exports.referral_stages = referral_stages;