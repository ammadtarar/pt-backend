module.exports = function(sequelize , DataTypes){
    var job = sequelize.define('job' , {
        url : {
            type : DataTypes.STRING,
            validate : {
                isUrl : true
            }
        },
        title : {
            type : DataTypes.STRING,
            allowNull : false
        },
        location : {
            type : DataTypes.STRING,
            allowNull : false
        },
        reward_point : {
            type : DataTypes.DOUBLE
        },
        is_active : {
            type : DataTypes.BOOLEAN,
            defaultValue : false
        },
        view_count : {
            type : DataTypes.INTEGER
        }
    });

    return job;
};