let statuses = require('../constants.js').REWARD_REDEMPTION_STAUSES;
module.exports = function(sequelize , DataTypes){
    var reward_redemption_request = sequelize.define('reward_redemption_request' , {
        status : {
            type : DataTypes.ENUM(statuses),
            values : statuses,
            defaultValue : statuses[0],
            set(value){
                if (!statuses.includes(value)) {
                    throw new EnumValidationError('incorrect status' , 'status' , statuses , value);
                }
                this.setDataValue('status', value);
            }
        }
    });
    return reward_redemption_request;
};