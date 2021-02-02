module.exports = function(sequelize , DataTypes){
    var article = sequelize.define('article' , {
        title : {
            type : DataTypes.STRING,
            allowNull : false
        },
        url : {
            type : DataTypes.STRING,
            allowNull : false,
            validate : {
                isUrl : true
            }
        },
        thumb_url : {
            type : DataTypes.STRING,
            allowNull : false,
            validate : {
                isUrl : true
            }
        },
        is_active : {
            type : DataTypes.BOOLEAN,
            defaultValue : true
        }
    });
    return article;
};