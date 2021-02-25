module.exports = function(sequelize, DataTypes){
    var settings = sequelize.define('settings' , {
        points_for_article_view : {
            type :  DataTypes.DOUBLE,
            defaultValue : 1
        },
        points_for_job_referral : {
            type :  DataTypes.DOUBLE,
            defaultValue : 100
        },
        points_for_job_application_received : {
            type :  DataTypes.DOUBLE,
            defaultValue : 300
        },
        points_for_job_candidate_interview_inprogress : {
            type :  DataTypes.DOUBLE,
            defaultValue : 1000
        }
    });
    return settings;
};