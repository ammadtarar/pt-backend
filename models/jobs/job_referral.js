module.exports = function(sequelize , DataTypes){
    var job_referral = sequelize.define('job_referral' , {
        stage : {
            type : DataTypes.ENUM,
            values : [
                'candidate_referred',
                'application_received',
                'undergoing_interview',
                'candidate_selected'
            ],
            defaultValue : 'candidate_referred'
        }
    });
    return job_referral;
};