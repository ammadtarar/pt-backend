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
        users : {
            count : await getUsersCount(req.user.companyId),
            total_points_earned : await getUsersPoints(companyUsersIds)
        },
        jobs : {
            count : await getJobsCounts(req.user.companyId),
            views_counts : await getJobsViewCounts(req.user.companyId),
            candidates : await getCandidatesCounts(req.user.companyId)
        },
        article : {
            count : await getArticlesCount(req.user.companyId),
            views_counts : await getArticlesViewsCount(req.user.companyId)
        },
        reward : {
            count : await getRewardsCount(req.user.companyId),
            redeem_requests_counts : await getRewardRedeemCounts(companyUsersIds),
        },
        quiz :{
            total : await getQuizCount(),
            average_score : await getQuizTestsCount(companyUsersIds).average_score || 0
        } 
        
    });



});


getQuizCount = async () =>{
    return new Promise((resolve , reject)=>{
        db.quiz.count({
            where : {
                is_active : true
            },
        })
        .then((count)=>{
            resolve(count);
        }).
        catch((err)=>{
            reject(err);
        });
    });

};


getUsersCount = async (companyId) =>{
    return new Promise((resolve , reject)=>{
        db.user.count({
            where : {
                companyId : companyId
            },
            group : ['status']
        })
        .then((articlesCount)=>{
            let active = articlesCount[0] ? articlesCount[0].count : 0;
            let inactive = articlesCount[1] ? articlesCount[1].count : 0;
            resolve({
                total : active + inactive,
                active : active,
                inactive : inactive
            });
        }).
        catch((err)=>{
            reject(err);
        });
    });

};

getUsersPoints = async (companyUsersIds) =>{
    return new Promise((resolve , reject)=>{
        db.wallet_transaction.findAll({
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('reward_value')), 'count'],
            ],
            where : {
                userId : companyUsersIds,
                transaction_type : 'incoming',
                reward_type : 'points'
            }
        })
        .then((response)=>{
            resolve(JSON.parse(JSON.stringify(response))[0].count || 0);
        }).
        catch((err)=>{
            reject(err);
        });
    });

};

getJobsCounts = async (companyId) =>{
    return new Promise((resolve , reject)=>{
        db.job.count({
            where : {
                companyId : companyId
            },
            group : ['is_active']
        })
        .then((articlesCount)=>{
            let active = articlesCount[0] ? articlesCount[0].count : 0;
            let inactive = articlesCount[1] ? articlesCount[1].count : 0;
            resolve({
                total : active + inactive,
                active : active,
                inactive : inactive
            });
        }).
        catch((err)=>{
            reject(err);
        });
    });

};

getCandidatesCounts = async(companyId) =>{
    return new Promise((resolve , reject)=>{
        db.job_referral.count({
            where : {
                companyId : companyId
            }
        })
        .then((totalsCandidates)=>{

            db.job_referral.count({
                where : {
                    companyId : companyId,
                    stage : 'candidate_referred'
                }
            })
            .then(referredCount =>{
                resolve({
                    total : totalsCandidates,
                    referred_count : referredCount
                })
            })
            
            return
            let active = articlesCount[0] ? articlesCount[0].count : 0;
            let inactive = articlesCount[1] ? articlesCount[1].count : 0;
            resolve({
                total : active + inactive,
                active : active,
                inactive : inactive
            });
        }).
        catch((err)=>{
            reject(err);
        });
    });
}

getJobsViewCounts = async (companyId) =>{
    return new Promise((resolve , reject)=>{
        db.job.findAll({
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('view_count')), 'count'],
            ],
            where : {
                companyId :companyId
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
            },
            group : ['is_active']
        })
        .then((articlesCount)=>{
            let active = articlesCount[0] ? articlesCount[0].count : 0;
            let inactive = articlesCount[1] ? articlesCount[1].count : 0;
            resolve({
                total : active + inactive,
                active : active,
                inactive : inactive
            });
        }).
        catch((err)=>{
            reject(err);
        });
    });
};


getArticlesViewsCount = async (companyId) =>{
    return new Promise((resolve , reject)=>{
        db.article.count({
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('view_count')), 'count'],
            ],
            where : {
                companyId :companyId
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
            let requested = redeems[0] ? redeems[0].count : 0;
            let approved = redeems[1] ? redeems[1].count : 0;
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

            let completed = counts[0] ? counts[0].count : 0;
            let in_progress = counts[1] ? counts[1].count : 0;
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