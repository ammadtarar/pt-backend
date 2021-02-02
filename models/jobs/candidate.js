module.exports = function(sequelize , DataTypes){
    var candidate = sequelize.define('candidate' , {
        email : {
            type : DataTypes.STRING,
            allowNull : false,
            unique : true,
            validate : {
                isEmail : true
            }
        },
        first_name : {
            type : DataTypes.STRING,
            allowNull : false
        },
        last_name : {
            type : DataTypes.STRING,
            allowNull : false
        },
        is_archived : {
            type : DataTypes.BOOLEAN,
            defaultValue : false
        }
    });
    return candidate;
};