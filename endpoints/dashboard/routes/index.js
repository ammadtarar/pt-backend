const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);
const CONSTANTS = require('../../../models/constants');

app.get('' , middleware.authenticateCompanyUser , async (req , res , next)=>{
    if(req.user.user_type != CONSTANTS.CONSTANTS.HR_ADMIN){
        res.status(422).json({
            message : res.__('only_hr')
        });
        return
    }
    
    let companyUsersIds = await getCompanyUsersIdsArray(req.user.companyId);

    res.json({
        jobs : {
            count : await getJobsCounts(req.user.companyId),
            shares_views_count : await getJobsShareCounts(companyUsersIds),
            referrals_count : await getJobReferrals(companyUsersIds)
        },
        article : {
            count : await getArticlesCount(req.user.companyId),
            share_views_count : await getArticlesViewsCount(companyUsersIds)
        },
        reward : {
            count : await getRewardsCount(req.user.companyId),
            redeem_requests_counts : await getRewardRedeemCounts(companyUsersIds),
        },
        quiz_test : await getQuizTestsCount(companyUsersIds)
    });



});

getJobsCounts = async (companyId) =>{
    return new Promise((resolve , reject)=>{
        db.job.count({
            where : {
                companyId : companyId
            }
        })
        .then((jobsCount)=>{
            resolve(jobsCount);
        }).
        catch((err)=>{
            reject(err);
        });
    });
};


getJobsShareCounts = async (companyUsersIds) =>{
    return new Promise((resolve , reject)=>{
        db.job_share.findAll({
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('view_count')), 'count'],
            ],
            where : {
                employeeId :companyUsersIds
            }
        })
        .then((count)=>{
            resolve(JSON.parse(JSON.stringify(count))[0].count || 0);
        }).
        catch((err)=>{
            reject(err);
        });
    });
};

getJobReferrals = async (usersIdsArray) =>{
    return new Promise((resolve , reject)=>{
        db.job_referral.count({
            where : {
                employeeId : usersIdsArray
            }
        })
        .then((referrals)=>{
            resolve(referrals);
        }).
        catch((err)=>{
            next(err);
        });
    });
};


getArticlesCount = async (companyId) =>{
    return new Promise((resolve , reject)=>{
        db.article.count({
            where : {
                companyId : companyId
            }
        })
        .then((articlesCount)=>{
            resolve(articlesCount);
        }).
        catch((err)=>{
            reject(err);
        });
    });
};


getArticlesViewsCount = async (usersIdsArray) =>{
    return new Promise((resolve , reject)=>{
        db.article_share.count({
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('view_count')), 'count'],
            ],
            where : {
                employeeId :usersIdsArray
            }
        })
        .then((count)=>{
            resolve(count);
        })
        .catch((err)=>{
            reject(err);
        });
    });
};


getRewardsCount = async (companyId) =>{
    return new Promise((resolve , reject)=>{
        db.reward.count({
            where : {
                companyId : companyId
            }
        })
        .then((articlesCount)=>{
            resolve(articlesCount);
        }).
        catch((err)=>{
            reject(err);
        });
    });
};

getRewardRedeemCounts = async (usersIdsArray) =>{
    return new Promise((resolve , reject)=>{
        db.reward_redemption_request.count({
            where : {
                employeeId : usersIdsArray
            },
            group : ['status']
        })
        .then((redeems)=>{
            let requested = redeems[0].count || 0;
            let approved = redeems[1].count || 0;
            resolve({
                total : requested + approved,
                requested : requested,
                approved : approved
            });
        })
        .catch((err)=>{
            reject(err);
        });
    });
};


getQuizTestsCount = async (usersIds) =>{
    return new Promise((resolve , reject)=>{
        db.quiz_test.count({
            where : {
                employeeId : usersIds
            },
            group : ['stage']
        })
        .then((counts)=>{

            let completed = counts[0].count || 0;
            let in_progress = counts[1].count || 0;
            var data = {
                total : completed + in_progress,
                completed : completed,
                in_progress : in_progress
            }

            db.quiz_test.findAll({
                where : {
                    employeeId : usersIds,
                    stage : 'completed'
                },
                attributes: [[db.sequelize.fn('AVG', db.sequelize.col('score')), 'avg']],
            })
            .then((scores)=>{
                try {
                    var scoresParsed = JSON.parse(JSON.stringify(scores));
                    data.average_score = scoresParsed[0].avg;    
                } catch (error) {
                    data.average_score = 0;
                }

                resolve(data);
            })
            
        })
        .catch((err)=>{
            reject(err);
        })
    });
};

getCompanyUsersIdsArray = async (companyId) =>{
    return new Promise((resolve , reject)=>{
        db.user.findAll({
            where : {
                companyId
            },
            attributes: ['id']
        })
        .then((ids)=>{
            var usersIdsArray = [];
            ids.forEach(element => {
                usersIdsArray.push(element.id)
            });
            resolve(usersIdsArray);
        })
        .catch((err)=>{
            reject(err);
        });
    });
};


module.exports = app;