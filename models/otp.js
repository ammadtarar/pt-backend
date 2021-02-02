const moment = require('moment');

module.exports = function(sequelize, DataTypes){
    var otp = sequelize.define('otp' , {
        code : {
            type :  DataTypes.STRING,
            allowNull : false
        },
        already_used : {
            type : DataTypes.BOOLEAN,
            defaultValue : false
        },
        expiry : {
            type : DataTypes.DATE
        }

    });


    otp.addHook('afterCreate', async (obj, options) => {
        await otp.update({ 
            expiry: moment(obj.createdAt).add(15, 'm').toDate()
        }, {
          where: {
            id: obj.id
          },
          transaction: options.transaction
        });
    });
    
    return otp;
};