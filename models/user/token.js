var cryptojs = require('crypto-js');

module.exports = function(sequelize, DataTypes) {
    var token = sequelize.define('token', {
        token: {
            type: DataTypes.VIRTUAL,
            allowNull: true,
            set: function(value) {
                var hash = cryptojs.MD5(value).toString();
                this.setDataValue('token', value);
                this.setDataValue('tokenHash', hash);
            }
        },
        tokenHash: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });
    return token;
};