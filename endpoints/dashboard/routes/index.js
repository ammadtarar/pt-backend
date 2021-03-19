const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);
const CONSTANTS = require('../../../models/constants');
const WALLET = require('../../company/routes/wallet');
const pointsController = require('../../../controllers/pointsController');

app.get('' , middleware.authenticateCompanyUser , async (req , res , next)=>{
    if(req.user.user_type === CONSTANTS.CONSTANTS.EMPLOYEE){
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
            views_counts : await getArticlesViewCounts(companyUsersIds) || 0
        },
        reward : {
            count : await getRewardsCount(req.user.companyId),
            redeem_requests_counts : await getRewardRedeemCounts(companyUsersIds),
        },
        quiz :{
            total : await getQuizCount(),
            average_score : parseFloat(await getCompanyQuizAvg(companyUsersIds)).toFixed(0) || 0
        } 
    
    });



});

app.get('/mobile' , middleware.authenticateCompanyUser , async (req , res , next)=>{
    if(req.user.user_type === CONSTANTS.CONSTANTS.HR_ADMIN){
        res.status(422).json({
            message : res.__('only_mobile')
        });
        return
    }


    


    let company = req.user.company;
    let companyUsersIds = await getCompanyUsersIdsArray(company.id);
    let referrals = await getJobReferrals(companyUsersIds);
    let balance = await getUserBalance(req.user.id)
    let jobslist = await getCompanyJobs(company.id);
    let candidates = await getUserReferredCandidates(req.user.id);
    let rewards = await getCompanyRewards(company.id);
    let articles = await getCompanyArticles(company.id);
    let quizzes = await getCompanyQuizzes(req.user.id);
    let userTrainings = await getUserTrainings(req.user.id);

    let userQuizStats = await getUserTrainigStatus(req.user.id);

    let userTrainigsAvg = await getUserQuizAverage(req.user.id);
    let companyQuizAvg = await getCompanyQuizAvg(companyUsersIds) || 0

    let userArticlesViewCount = await getArticlesViewCounts(req.user.id) || 0;
    let userArticleViewsPoints = await getArticlesClickPoints(req.user.id) || 0;

    let companyTotalArticleViewCounts = await getArticlesViewCounts(companyUsersIds) || 0;
    let activeArticlesCount = await getArticlesCount(req.user.companyId) || 0;
    let candidatesPoints = await getAccumatedPointsFromReferrals(req.user.id) || 0;

    var comp = {
        username : `${req.user.first_name} ${req.user.last_name}`,
        reward : {
            left : balance.points_balance
        },
        company : {
            name : company.name,
            logo : '',
            style : {primaryColor : '#1750A6'},
            visitors : companyTotalArticleViewCounts,
            activeArticlesCount : activeArticlesCount.active,
            candidates : referrals,
            jobs : jobslist,
            articles : articles,
            trainings : {
                data : quizzes,
                average: `${parseFloat(companyQuizAvg).toFixed(0)}%`
            },
            rewards : rewards  
        },
        candidates : candidates,//list,
        candidatesPoints : candidatesPoints,
        articles : {
            seen: userArticlesViewCount,
            points: userArticleViewsPoints,
        },
        trainings : userTrainings, 
        trainingsTaken : userQuizStats,
        trainingsAvg : parseFloat(userTrainigsAvg).toFixed(0),
        app: {
            cguUrl:'https://www.pushtalents.com',
            contactUsEmail: 'contact@pushtalents.com',
            contactUsSubject: "Demande d'informations Pushtalents",
          }
    };


    
    res.json(comp);

})


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
        db.user.findAll({
            where : {
                companyId : companyId,
                user_type: {
                    [db.Op.not]: CONSTANTS.CONSTANTS.HR_ADMIN
                }
            }
        })
        .then((usersCount)=>{
            var active = 0;
            var inactive = 0;
            usersCount.forEach(user => {
                if(user.last_active_time){
                    active++;
                }else{
                    inactive++
                }
            });
            resolve({
                total : usersCount.length,
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
        .then((count)=>{
            var inactive = 0 , active = 0;
            count.forEach(item =>{
                if(!item.is_active){
                    inactive = item.count
                }else{
                    active = item.count
                }
            })
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
        .then((count)=>{
            var inactive = 0 , active = 0;
            count.forEach(item =>{
                if(!item.is_active){
                    inactive = item.count
                }else{
                    active = item.count
                }
            })
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
            }
        })
        .then((counts)=>{

            var data = {
                total : counts
            }

            db.quiz_test.findAll({
                where : {
                    employeeId : usersIds
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


getCompanyJobs = async (companyId) => {
    return new Promise((resolve , reject) => {
        db.job.findAll({
            where : {
                companyId : companyId,
                is_active : true
            }
        })
        .then(rawJobs => {
            var jobs = [];
            rawJobs.forEach(item =>{
                jobs.push({
                    id : item.id,
                    name : item.title,
                    city : item.location,
                    url : item.url,
                    reward : {
                        value : item.referral_success_reward_value,
                        type : item.referral_success_reward_type,
                        currency: '€'
                    }
                })
            });
            resolve(jobs);
        })
        .catch(err => {
            resolve([]);
        })
    });
};

getUserReferredCandidates = async (userId) => {
    return new Promise((resolve , reject) => {
        db.job_referral.findAll({
            where : {
                employeeId : userId
            },
            attributes : {
                exclude : ['jobId', 'companyId', 'employeeId' , 'candidateId']
            },
            include : [
                {
                    model : db.job,
                    as : "job"
                },
                {
                    model : db.candidate,
                    as : 'candidate'
                },
                {
                    model : db.user,
                    as : "employee",
                    attributes : {
                        exclude : ['salt', 'password_hash', 'tokenHash' , 'companyId']
                    }
                }
            ]
        })
        .then(async (rawReferrals) =>{
            
            const pointsData = await pointsController.getPointsData();

            var referrals = [];
            for(const item of rawReferrals){
                let stepAndReward = await getStageNumber(item.job.id , item.stage);
                
                referrals.push({
                    id : item.id,
                    name : `${item.candidate.first_name} ${item.candidate.last_name}`,
                    job : item.job.title,
                    currentStep : stepAndReward.currentStep,
                    currentPoint : stepAndReward.reward_value,
                    step4 : {
                        value: item.job.referral_success_reward_value,
                        currency: '€',
                        type: item.job.referral_success_reward_type,
                    },
                    points : {
                        step1 : pointsData.points_for_job_referral,
                        step2 : pointsData.points_for_job_application_received,
                        step3 : pointsData.points_for_job_candidate_interview_inprogress
                    },
                    archived : item.archive
                });
            }

            resolve(referrals);
        })
        .catch(err => {
            resolve([]);
        })
    });
}


getStageNumber = async (jobId , stage) => {
    return new Promise(async (resolve , reject) => {
        const pointsData = await pointsController.getPointsData();
        var currentStep , reward_value;
        if(stage === CONSTANTS.CONSTANTS.CANDIDATE_REFERRED){// 100 PTS
            currentStep = 1;
            reward_value = pointsData.points_for_job_referral;
        }else if(stage === CONSTANTS.CONSTANTS.APPLICATION_RECEIVED){// 300 PTS
            currentStep = 2;
            reward_value = pointsData.points_for_job_application_received;
        }else if(stage === CONSTANTS.CONSTANTS.UNDERGOING_INTERVIEW){// 1000 PTS
            currentStep = 3;
            reward_value = pointsData.points_for_job_candidate_interview_inprogress;
        }else{// candidate_selected -  DEFINED IN JOB
            let job = await db.job.findOne({ where : { id : jobId}})
            currentStep = 4;
            reward_value = job.referral_success_reward_value;
        }
        resolve({
            currentStep : currentStep,
            reward_value : reward_value
        })
    });
}

getCompanyRewards = async (companyId) =>{
    return new Promise((resolve , reject)=>{
        db.reward.findAndCountAll({
            where : {
                companyId : companyId,
                is_active : true
            },
            order: [
                ['createdAt', 'DESC']
            ],
            attributes : {
                exclude : ['hrId' , 'companyId']
            }
        }) 
        .then(rawRewards => {
            var rewards = [];
            rawRewards.rows.forEach(item => {
                rewards.push({
                    id : item.id,
                    name : item.title,
                    points : item.points_required
                });
            });
            resolve(rewards);
        })
        .catch(err => {
            resolve([]);
        })
    });
};

getCompanyArticles = async (companyId) => {
    return new Promise((resolve , reject) => {
        db.article.findAll({
            where : {
                companyId : companyId,
                is_active : true
            }
        })
        .then(rawArticles => {
            var articles = [];
            rawArticles.forEach(item => {
                articles.push({
                    id : item.id,
                    publishedAt : new Date(item.createdAt).getTime(),
                    title : item.title,
                    imageUrl : item.thumb_url,
                    url : item.original_url
                });
            });
            resolve(articles);
        })
        .catch(err => {
            resolve([]);
        })
    });
};

getUserTrainings = async (userId) =>{
    return new Promise((resolve , reject)=>{
        db.quiz_test.findAll({
            where : {
                employeeId : userId
            }
        })
        .then(res => {
            resolve(res);
        })
        .catch(err => {
            resolve([])
        })
    });
};

getUserTrainigStatus = (userId) => {
    return new Promise((resolve , reject)=>{
        db.quiz_test.count({
            where : {
                employeeId : userId
            },
            distinct : true,
            col : 'quizId'
        })
        .then(res => {
            resolve(res);
        })
        .catch(err => {
            resolve([])
        })
    });
};


getUserQuizAverage = async (userId) =>{
    return new Promise((resolve , reject)=>{
        db.quiz_test.findAll({
            where : {
                employeeId : userId
            },
            attributes: [[db.sequelize.fn('AVG', db.sequelize.col('score')), 'avg']],
        })
        .then(res => {
            var avg=0;
            try {
                var scoresParsed = JSON.parse(JSON.stringify(res));
                avg = scoresParsed[0].avg;    
            } catch (error) {
                avg = 0;
            }
            if(!avg || avg === null || avg === 'avg'){
                avg = 0;
            }
            resolve(avg);
        })
        .catch(err => {
            resolve(0);
        })
    });
};

getCompanyQuizAvg = async (usersIds) => {
    return new Promise((resolve , reject)=>{
        db.quiz_test.findAll({
            where : {
                employeeId : usersIds
            },
            attributes: [[db.sequelize.fn('AVG', db.sequelize.col('score')), 'avg']],
        })
        .then(res => {
            var avg=0;
            try {
                var scoresParsed = JSON.parse(JSON.stringify(res));
                avg = scoresParsed[0].avg;    
            } catch (error) {
                avg = 0;
            }
            if(!avg || avg === null || avg === 'avg'){
                avg = 0;
            }
            resolve(avg);
        })
        .catch(err => {
            resolve(0)
        })
    });
};

getCompanyQuizzes = async (employeeId) => {
    return new Promise((resolve , reject) => {
        db.quiz.findAll({
            where : {
                is_active : true
            },
            order: [
                ['createdAt', 'DESC']
            ],
            include: [{
                model : db.quiz_item,
                as : 'questions',
                attributes : {
                    exclude : ['quizId']
                }
            }],
            distinct:true
        })
        .then((rawQuizzes) => {
            var quizzes = [];

            rawQuizzes.forEach(async item => {

                let score = await getUserHightestScoreForQuiz(employeeId , item.id);


                var question = {
                    id : item.id,
                    name : item.title,
                    difficulty: item.level === 'easy' ? 0 : (item.level === 'medium' ? 1 : 2),
                    type: item.description,
                    max: 24,
                    questions : [],
                    lastTest : {
                        taken : score && score != -1,
                        score : score
                    }
                };



                item.questions.forEach(qnas => {
                    question.questions.push({
                        id : qnas.id,
                        q : qnas.question,
                        a : [
                            qnas.option_one,
                            qnas.option_two,
                            qnas.option_three
                        ],
                        r : qnas.answer === 'option_one' ? 0 : (qnas.answer === 'option_two' ? 1 : 2)
                    });
                });

                quizzes.push(question);

                // db.quiz_test.findAll({
                //     where : {
                //         employeeId : employeeId,
                //         stage : CONSTANTS.CONSTANTS.COMPLETED,

                //     }
                // })
            });
            resolve(quizzes);
        })
        .catch((err) => {
            resolve([]);
        });
    });
};

getArticlesViewCounts = (employeeId) => {
    return new Promise((resolve , reject) => {
        db.article_share.findAll({
            where : {
                employeeId : employeeId
            },
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('view_count')), 'count'],
            ],
        })
        .then(res => {
            let data = JSON.parse(JSON.stringify(res[0]));
            resolve(data.count || 0)
        })
        .catch(err => {
            resolve(0)
        });
    });
}

getArticlesClickPoints = (employeeId) => {
    return new Promise((resolve , reject) => {
        db.wallet_transaction.findAll({
            where : {
                userId : employeeId,
                transaction_type : CONSTANTS.CONSTANTS.INCOMING,
                transaction_source : CONSTANTS.CONSTANTS.ARTICLE_CLICK,
            },
            attributes : [
                [db.sequelize.fn('SUM' , db.sequelize.col('reward_value')) , 'totalPoints']
            ]
        })
        .then(res => {
            let data = JSON.parse(JSON.stringify(res[0]));
            resolve(data.totalPoints || 0)
        })
        .catch(err => {
            resolve(0)
        });
    });
};

getUserHightestScoreForQuiz = (userId , quizId) => {
    return new Promise(async (resolve , reject) => {
        let completed = await db.quiz_test.findOne({
            where : {
                quizId : quizId,
                employeeId : userId
            },
            attributes:[
                [db.sequelize.fn('max', db.sequelize.col('score')),'max']
            ]
        });

        if(completed){ // JUST RETURN THE SCORE OF THE LA
            let data = JSON.parse(JSON.stringify(completed)).max;
            if(data){
                resolve(String(data.toFixed(0)))
            }else{
                resolve(-1)
            }
            
        }else{
            resolve(-1)
        }

        // let inProgress = await db.quiz_test.findOne({
        //     where : {
        //         quizId : quizId,
        //         employeeId : userId,
        //         stage : CONSTANTS.CONSTANTS.IN_PROGRESS
        //     },
        //     order: [ [ 'createdAt', 'DESC' ]]
        // });

        // resolve({
        //     inProgress : inProgress,
        //     completed : completed
        // })


        // .then(res => {
        //     console.log(res);
        //     resolve(res)
        // })
        // .catch(err => {
        //     console.log(err);
        //     resolve([])
        // })
    });
}

getAccumatedPointsFromReferrals = (userId) => {
    return new Promise((resolve , reject)=>{
        db.wallet_transaction.findAll({
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('reward_value')), 'count'],
            ],
            where : {
                userId : userId,
                transaction_type : 'incoming',
                reward_type : 'points',
                transaction_source : CONSTANTS.CONSTANTS.JOB_REFERRAL
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

module.exports = app;