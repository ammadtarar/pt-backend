module.exports = function(sequelize , DataTypes){
    var reward_redemption_request = sequelize.define('reward_redemption_request' , {
        status : {
            type : DataTypes.ENUM,
            values : [
                'requested',
                'approved'
            ],
            defaultValue : 'requested'
        }
    });
    return reward_redemption_request;
};