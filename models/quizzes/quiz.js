let referral_success_reward_types = require('../constants.js').QUIZ_DIFFICULTY_LEVELS;

module.exports = function(sequelize , DataTypes){
    var quiz = sequelize.define('quiz' , {
        title : {
            type : DataTypes.STRING,
            allowNull : false
        },
        description : {
            type : DataTypes.STRING,
            allowNull : false
        },
        level : {
            type : DataTypes.ENUM(referral_success_reward_types),
            values : referral_success_reward_types,
            defaultValue : referral_success_reward_types[0],
            set(value){
                if (!referral_success_reward_types.includes(value)) {
                    throw new EnumValidationError('incorrect level' , 'level' , referral_success_reward_types , value);
                }
                this.setDataValue('user_type', value);
            }
        },
        is_active : {
            type : DataTypes.BOOLEAN,
            defaultValue : true
        }
    });
    return quiz;
};