module.exports = function(sequelize , DataTypes){
    var job_share = sequelize.define('job_share' , {
        url : {
            type : DataTypes.STRING,
            allowNull : false,
            validate : {
                isUrl : true
            }
        },
        view_count : {
            type : DataTypes.INTEGER
        }
    });
    return job_share;
};