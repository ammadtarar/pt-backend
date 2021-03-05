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

app.get('/mobile' , middleware.authenticateCompanyUser , async (req , res , next)=>{
    if(req.user.user_type === CONSTANTS.CONSTANTS.HR_ADMIN){
        res.status(422).json({
            message : res.__('only_mobile')
        });
        return
    }

    let company = req.user.company;
    let companyUsersIds = await getCompanyUsersIdsArray(company.id);
    let jobs_count = await getJobsCounts(company.id);
    let referrals = await getJobReferrals(companyUsersIds);
    let balance = await getUserBalance(req.user.id)
    let totalBalance = await getUserTotalPoints(req.user.id)
    let jobslist = await getCompanyJobs(company.id);

    // company.jobs = jobslist
    // company.visitors = 0;
    // company.articles = [];
    // company.trainings = {
    //     data : [],
    //     average : "0%"
    // };
    // company.rewards = [];

    let candidates = await getUserReferredCandidates(req.user.id);
    let rewards = await getCompanyRewards(company.id);
    let articles = await getCompanyArticles(company.id);
    let quizzes = await getCompanyQuizzes();

    var comp = {
        username : `${req.user.first_name} ${req.user.last_name}`,
        reward : {
            left : balance.points_balance
        },
        company : {
            name : company.name,
            logo : '',
            style : {primaryColor : '#1750A6'},
            visitors : 111,
            candidates : referrals,
            jobs : jobslist,
            articles : articles,
            trainings : {
                data : quizzes,
                average: '60%'
            },
            rewards : rewards
        },
        candidates : candidates,//list,
        articles : {
            seen: 125,
            points: 225,
        },
        trainings : [],
        app: {
            cguUrl:
              'https://medium.com/@numaparis/startups-pourquoi-r%C3%A9diger-vos-cgu-cgv-et-charte-de-confidentialit%C3%A9-e4f0d655b1e0',
            contactUsEmail: 'sebastien.aumaitre@pushtalents.com',
            contactUsSubject: 'Sujet de Contactez-nous',
          }
    };

    res.json(comp);

    // res.json({
    //     company : company,
    //     jobs_count : jobs_count,
    //     referrals : referrals,
    //     balance : {
    //         available : balance.points_balance,
    //         total : totalBalance
    //     },

    // });

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
        db.user.count({
            where : {
                companyId : companyId,
                user_type : 'employee'
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
        .then((count)=>{
            var inactive = 0 , active = 0;
            count.forEach(item =>{
                console.log(item);
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
                console.log(item);
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


getCompanyJobs = async (companyId) => {
    return new Promise((resolve , reject) => {
        db.job.findAll({
            where : {
                companyId : companyId
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
            var referrals = [];
            for(const item of rawReferrals){
                console.log("started");
                let stepAndReward = await getStageNumber(item.stage);
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
                    }
                });
            }
            resolve(referrals);
        })
        .catch(err => {
            resolve([]);
        })
    });
}


getStageNumber = async (stage) => {
    return new Promise(async (resolve , reject) => {
        const pointsData = await pointsController.getPointsData();
        var currentStep , reward_value;
        if(stage === CONSTANTS.CONSTANTS.CANDIDATE_REFERRED){// 100 PTS
            currentStep = 1;
            reward_value = pointsData.points_for_job_referral;
        }else if(stage === CONSTANTS.CONSTANTS.APPLICATION_RECEIVED){// 300 PTS
            currentStep = CONSTANTS.CONSTANTS.POINTS;
            reward_value = pointsData.points_for_job_application_received;
        }else if(stage === CONSTANTS.CONSTANTS.UNDERGOING_INTERVIEW){// 1000 PTS
            currentStep = CONSTANTS.CONSTANTS.POINTS;
            reward_value = pointsData.points_for_job_candidate_interview_inprogress;
        }else{// candidate_selected -  DEFINED IN JOB
            let job = await db.job.findOne({ where : { id : job_referral.jobId}})
            currentStep = job.referral_success_reward_type;
            reward_value = job.referral_success_reward_value;
        }
        console.log("done inside");
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
                companyId : companyId
            },
            order: [
                ['createdAt', 'DESC']
            ],
            attributes : {
                exclude : ['hrId' , 'companyId']
            }
        }) 
        .then(rawRewards => {
            console.log("rawRewards");
            console.log(JSON.parse(JSON.stringify(rawRewards)));
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

getCompanyQuizzes = async () => {
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

            rawQuizzes.forEach(item => {
                var question = {
                    id : item.id,
                    name : item.title,
                    difficulty: item.level === 'easy' ? 0 : (item.level === 'medium' ? 1 : 2),
                    type: '',
                    max: 24,
                    questions : []
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
            });
            resolve(quizzes);
        })
        .catch((err) => {
            resolve([]);
        });
    });
};

module.exports = app;