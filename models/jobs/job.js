let referral_success_reward_types = require('../constants.js').JOB_REFERRAL_SUCCESS_REWARD_TYPES;

module.exports = function(sequelize , DataTypes){
    var job = sequelize.define('job' , {
        url : {
            type : DataTypes.STRING,
            validate : {
                isUrl : true
            }
        },
        title : {
            type : DataTypes.STRING,
            allowNull : false
        },
        location : {
            type : DataTypes.STRING,
            allowNull : false
        },
        referral_success_reward_type : {
            type : DataTypes.ENUM(referral_success_reward_types),
            values : referral_success_reward_types,
            defaultValue : referral_success_reward_types[0],
            set(value){
                if (!referral_success_reward_types.includes(value)) {
                    throw new EnumValidationError('incorrect referral_success_reward_type' , 'referral_success_reward_type' , referral_success_reward_types , value);
                }
                this.setDataValue('referral_success_reward_type', value);
            }
        },
        referral_success_reward_value : {
            type : DataTypes.DOUBLE,
            defaultValue : 0
        },
        cash_reward_currency : {
            type : DataTypes.STRING
        },
        is_active : {
            type : DataTypes.BOOLEAN,
            defaultValue : true
        },
        view_count : {
            type : DataTypes.INTEGER,
            defaultValue : 0
        }
    });

    job.prototype.updateViewCount = function() {
        job.update({
            view_count: (this.getDataValue('view_count') || 0) + 1
        }, {
          where: {
            id: this.getDataValue('id')
          }
        })
    };
    

    return job;
};