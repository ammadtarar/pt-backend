const db = require('./db.js');

getPointsData = async() =>{
    return new Promise((resolve , reject)=>{
        db.settings.findOne({
            where : {
                id : 1
            }
        })
        .then(data => {
            resolve(data);
        })
        .catch(err => {
            resolve({
                "points_for_article_view": 1,
                "points_for_job_referral": 100,
                "points_for_job_application_received": 300,
                "points_for_job_candidate_interview_inprogress": 1000
            })
            console.log();
            console.log("==== ERROR IN getPointsData of pointsController.js ====");
            console.error(err);
            console.log("====");
            console.log();
        })
    })
};


module.exports.getPointsData = getPointsData;