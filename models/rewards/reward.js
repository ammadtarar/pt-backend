const { mode } = require("crypto-js");

module.exports = function(sequelize , DataTypes){
    var reward = sequelize.define('reward' , {
        title : {
            type : DataTypes.STRING,
            allowNull : false
        },
        points_required : {
            type : DataTypes.DOUBLE
        },
        is_active : {
            type : DataTypes.BOOLEAN,
            defaultValue : true
        }
    });
    return reward;
};