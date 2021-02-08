const { mode } = require("crypto-js");

module.exports = function(sequelize , DataTypes){
    var article_share = sequelize.define('article_share' , {
        view_count : {
            type : DataTypes.INTEGER
        }
    });

    article_share.prototype.updateViewCount = function() {
        article_share.update({
            view_count: (this.getDataValue('view_count') || 0) + 1
        }, {
          where: {
            id: this.getDataValue('id')
          }
        })
    };

    return article_share;
};