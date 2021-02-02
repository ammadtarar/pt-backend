const { mode } = require("crypto-js");

module.exports = function(sequelize , DataTypes){
    var article_share = sequelize.define('article_share' , {
        view_count : {
            type : DataTypes.INTEGER
        }
    });
    return article_share;
};