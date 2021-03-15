const { Router, response } = require('express');
const app = Router();
const underscore = require('underscore');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);
const emailer = require('../../../controllers/emailer.js');
const REFERRAL_STAGES = require('../../../models/constants.js').JOB_REFERRAL_STAGES;
const CONSTANTS = require('../../../models/constants');
const pointsController = require('../../../controllers/pointsController')

const metascraper = require('metascraper')([
    require('metascraper-author')(),
    require('metascraper-date')(),
    require('metascraper-description')(),
    require('metascraper-image')(),
    require('metascraper-logo')(),
    require('metascraper-clearbit')(),
    require('metascraper-publisher')(),
    require('metascraper-title')(),
    require('metascraper-url')()
  ]);
const got = require('got');

app.post('/create' , middleware.authenticateSuperAdmin , async (req , res , next)=>{
    
    let body = req.body;
    if (body === null || body === undefined || Object.keys(body).length === 0) {
        res.status(422).send({
            message: res.__('body_data_missing')
        });
        return;
    }

    // var job = underscore.pick(body , 'url' , 'title' , 'location' , 'companyId' , 'referral_success_reward_type' , 'referral_success_reward_value');
    
    var job = {};


    if(!req.body.hasOwnProperty("custom") || req.body.custom == false){
        var data = underscore.pick(body , 'url' , 'title' , 'location' , 'companyId' , 'referral_success_reward_type' , 'referral_success_reward_value');
        if(data === null || data === undefined  || Object.keys(data).length != 6){
            res.status(422).send({
                message: res.__('job_missing_data')
            });
            return;
        }
        job = data;
    }else{
        var data = underscore.pick(body , 'url' , 'location' , 'companyId' , 'referral_success_reward_type' , 'referral_success_reward_value');
        try{
            const { body: html, url } = await got(data.url);
            const metadata = await metascraper({ html, url });
            data.title = metadata.title;
            job = data;
        }catch(e){
            console.log("FETCHING ERROR");
            console.log(e);
            res.status(432).json({
                message : res.__('cannot_fetch_job_data_from_url')
            })
            return
        }
    }

    db.job.create(job)
    .then((response)=>{
        res.json({
            message : res.__('job_created_successfully'),
            job : response
        });
    })
    .catch((err)=>{
       next(err);
    });
});

app.get('/list/all' , middleware.authenticate , (req , res , next)=>{
  
    if(!req.isSuperAdmin && req.user.user_type === CONSTANTS.CONSTANTS.EMPLOYEE){
        res.status(422).send({
            message: res.__('employee_not_allowed')
        });
        return;
    }

    

    var limit = parseInt(req.query.limit) || 10;
    var page = parseInt(req.query.page) || 0;
    if (page >= 1) {
        page = page - 1;
    }

    var where = {};

    if(!req.isSuperAdmin){
        where.companyId = req.user.companyId;
    }else{
        let companyId = parseInt(req.query.companyId) || 0;
        if(companyId > 0){
            where.companyId = companyId;
        }
    }

    

    if(req.query.hasOwnProperty("is_active")){
        where.is_active = req.query.is_active === 'true';
    }

    let title = req.query.title;
    if(title !== null && title !== undefined){
        where.title = {
            [db.Op.like]: '%' + title + '%'
        }
    }

    let url = req.query.url || '';
    if(url !== null && url !== undefined && url != ''){
        where.url = {
            [db.Op.like]: '%' + url + '%'
        }
    }

    let location = req.query.location || '';
    if(location !== null && location !== undefined && location != ''){
        where.location = {
            [db.Op.like]: '%' + location + '%'
        }
    }

    db.job.findAndCountAll({
            where : where,
            limit: limit,
            offset: limit * page,
            order: [
                ['createdAt', 'DESC']
            ],
            include: [{
                model: db.company,
                as: "company"
            } , {
                model : db.job_referral,
                as : 'referrals'
            }]
        })
        .then((companies) => {
            res.json(companies);
        })
        .catch((err) => {
            next(err);
        });
    
});

app.post('/referral/:id/archive' , middleware.authenticate , (req , res , next)=>{
    if(!req.isSuperAdmin && req.user.user_type === CONSTANTS.CONSTANTS.EMPLOYEE){
        res.status(422).send({
            message: res.__('employee_not_allowed')
        });
        return;
    }

    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('job_id_missing_params')
        });
        return;
    }

    db.job_referral.update({
        archive : true
    } , {
        where : {
            id : id
        }
    })
    .then(response =>{
        res.json({
            message : res.__('referral_archived')
        })
    })
});

app.patch('/:id' , middleware.authenticate ,(req , res , next)=>{
    if(!req.isSuperAdmin && req.user.user_type === CONSTANTS.CONSTANTS.EMPLOYEE){
        res.status(422).send({
            message: res.__('employee_not_allowed')
        });
        return;
    }
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('job_id_missing_params')
        });
        return;
    }
    
    let body = req.body;
    if (body === null || body === undefined || Object.keys(body).length === 0) {
        res.status(422).send({
            message: res.__('body_data_missing')
        });
        return;
    }

    var update = {};
    
    console.log("body");
    console.log(body);
    if(body.url){
        update.url = body.url;
    }

    if(body.title){
        update.title = body.title;
    }

    if(body.location){
        update.location = body.location;
    }

    if(body.hasOwnProperty('is_active')){
        update.is_active = body.is_active ;
    }

    if(body.companyId){
        update.companyId = body.companyId;
    }


    console.log(update);
    
    db.job.update(update , {
        where : {
            id : id
        }
    })
    .then((response)=>{
        if(response){
            res.json({
                message : res.__('job_updated_successfully')
            });
        }else{
            res.json({
                message : res.__('job_update_failed')
            });
        }
    })
    .catch((err)=>{
        next(err)
    })

});

app.post('/:id/generate/share/link' , middleware.authenticateCompanyUser , (req , res , next)=>{
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('job_id_missing_params')
        });
        return;
    }

    db.job_share.findOne({ 
        where : {
            employeeId : req.user.id,
            jobId : id
        }
    })
    .then((shareRes)=>{
        if(shareRes){
            res.json({
                message : res.__('job_share_link_generated'),
                shareId : shareRes.id,
                url : process.env.BASE_URL + 'company/job/share/' + String(shareRes.id)
            });
        }else{
            db.job_share.create({
                employeeId : req.user.id,
                jobId : id
            })
            .then((response)=>{
                res.json({
                    message : res.__('job_share_link_generated'),
                    shareId : response.id,
                    url : process.env.BASE_URL + 'company/job/share/' + String(response.id)
                });
            })
            
        }
    })
    .catch((err)=>{
        next(err);
    });

});

app.get('/share/:id' , (req , res , next)=>{
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('job_id_missing')
        });
        return;
    }
    db.job_share.findOne({
        where : {
            id : id
        },
        include: [
            {
                model : db.job,
                as : "job"
            }
        ]
    })
    .then((response)=>{
        response.job.updateViewCount();
        if(response){
            response.updateViewCount();
            res.statusCode = 302;
            res.setHeader("Location", response.job.url);
            res.end();
        }else{
            res.status(404).json({
                message : res.__("job_share_not_found" , {id : id})
            });
        }
        
    })
    .catch((err)=>{
        next(err)
    })
});

app.get('/share/:id/data' , middleware.authenticate , (req , res , next)=>{
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('job_id_missing')
        });
        return;
    }
    db.job_share.findOne({
        where : {
            id : id
        },
        include: [
            {
                model: db.user,
                as: "employee",
                include : [
                    {
                        model : db.company,
                        as : "company"
                    }
                ],
                attributes : {
                    exclude : ['salt', 'password_hash', 'tokenHash' , 'companyId']
                }
            },
            {
                model : db.job,
                as : "job",
                include : [
                    {
                        model : db.company,
                        as : "company"
                    }
                ],
                attributes : {
                    exclude : ['companyId']
                }
            }
        ],
        attributes: {
            exclude: ['jobId', 'employeeId']
        },
    })
    .then((response)=>{
        if(response){
            res.json(response)
        }else{
            res.status(404).json({
                message : res.__("job_share_not_found" , {id : id})
            });
        }
        
    })
    .catch((err)=>{
        next(err)
    })
});

app.post('/:id/generate/referral' , middleware.authenticateCompanyUser , (req , res , next)=>{


    if(!req.isSuperAdmin && req.user.user_type === CONSTANTS.CONSTANTS.HR_ADMIN){
        res.status(422).send({
            message: res.__('hr_admin_not_allowed')
        });
        return;
    };

    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('job_id_missing')
        });
        return;
    }

    let body = req.body;
    if (body === null || body === undefined || Object.keys(body).length === 0) {
        res.status(422).send({
            message: res.__('body_data_missing')
        });
        return;
    }

    var candidateData = underscore.pick(body , 'first_name' , 'last_name' , 'email');
    if(candidateData === null || candidateData === undefined  || Object.keys(candidateData).length != 3){
        res.status(422).send({
            message: res.__('missing_candidate_data')
        });
        return;
    }

    db.candidate.findOrCreate({
        where : candidateData
    })
    .then((candidateResult)=>{
        let candidate = candidateResult[0];

        db.job_referral.findOrCreate({
            where : {
                candidateId : candidate.id,
                jobId : id,
                employeeId : req.user.id,
                companyId : req.user.companyId
            }
        })
        .then(async (referral)=>{
            let referralUrl = process.env.BASE_URL + 'company/job/referral/' + String(referral[0].id);
            const pointsData = await pointsController.getPointsData();
            
            res.json({
                message : res.__('job_referral_successful'),
                referralId : referral[0].id,
                referralUrl : referralUrl,
                points_earned : pointsData.points_for_job_referral
            });

            
            
            db.wallet_transaction.create({
                reward_type : CONSTANTS.CONSTANTS.POINTS,
                reward_value : pointsData.points_for_job_referral,
                transaction_type : CONSTANTS.CONSTANTS.INCOMING,
                userId : req.user.id,
                transaction_source : CONSTANTS.CONSTANTS.JOB_REFERRAL,
                jobReferralId : referral[0].id
            })
            .then((transResult)=>{
                emailer.sendJobReferral(candidate , req.user , referralUrl)
                .then(()=>{
                    console.log();
                    console.log();
                    console.log("=====");
                    console.log("Job referral email sent to candidate succcessfully");
                    console.log("=====");
                    console.log("=====");

                })
            });

            
        });

    })
    .catch((err)=>{
        next(err);
    });

});

app.get('/referral/list/all' , middleware.authenticateCompanyUser , (req , res , next)=>{

    console.log(`req.user.user_type = ${req.user.user_type}`);
    console.log(`CONSTANTS.CONSTANTS.HR_ADMIN = ${CONSTANTS.CONSTANTS.HR_ADMIN}`);
    if(!req.isSuperAdmin && req.user.user_type === CONSTANTS.CONSTANTS.EMPLOYEE){
        res.status(422).send({
            message: res.__('employee_not_allowed')
        });
        return;
    }


    var where = {
        companyId : req.user.companyId
    };

    if(req.query.hasOwnProperty("archive")){
        console.log("HAVE");
        where.archive = req.query.archive === "true" ? true : false;
    }

    console.log();
    console.log();
    console.log();
    console.log();
    console.log("where");
    console.log(where);

    db.job_referral.findAll({
        where : where,
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
    .then(response=>{
        console.log(JSON.parse(JSON.stringify(response)));
        console.log();
        console.log();
        console.log();
        console.log();
        console.log("====");
        res.json(response)
    })
    .catch(err =>{
        console.log(err);
        console.log("####");
        next(err)
    })
});

app.get('/referral/:id' , (req , res , next)=>{

    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('job_referral_id_missing')
        });
        return;
    }

    db.job_referral.findOne({
        where : {
            id : id
        },
        include : [
            {
                model : db.job,
                as : "job"
            }
        ]
    })
    .then((referral)=>{
        // res.json(referral)
        // return
        if(referral){
            res.statusCode = 302;
            res.setHeader("Location", referral.job.url);
            res.end();
        }else{
            res.status(404).json({
                message : res.__("referral_not_found")
            })
        }
    })
    .catch((err)=>{
        next(err);
    });

});


app.get('/referral/:id/detail' , (req , res , next)=>{

    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('job_referral_id_missing')
        });
        return;
    }

    db.job_referral.findOne({
        where : {
            id : id
        },
        attributes : {
            exclude : ['jobId', 'companyId', 'employeeId' , 'candidateId']
        },
        include : [
            {
                model : db.job,
                as : "job",
                include : [
                    {
                        model : db.company,
                        as : "company"
                    }
                ]
            },
            {
                model : db.candidate,
                as : 'candidate'
            },
            {
                model : db.user,
                as : "employee",
                include : [
                    {
                        model : db.company,
                        as : "company"
                    }
                ],
                attributes : {
                    exclude : ['salt', 'password_hash', 'tokenHash' , 'companyId']
                }
            }
        ]
    })
    .then((referral)=>{
        if(referral){
            res.json(referral);
        }else{
            res.status(404).json({
                message : res.__("referral_not_found")
            })
        }
    })
    .catch((err)=>{
        next(err);
    });

});

app.post('/referral/:id/update/status' , middleware.authenticateCompanyUser , (req , res , next)=>{
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('job_referral_id_missing')
        });
        return;
    }

    let body = underscore.pick(req.body , 'stage');
    if (body === null || body === undefined || Object.keys(body).length <= 0) {
        res.status(422).send({
            message: res.__('body_data_missing')
        });
        return;
    }

  
    db.job_referral.findOne({
        where : {
            id : id
        }
    })
    .then((job_referral)=>{
        if(!job_referral){
            res.status(404).json({
                message : res.__('referral_not_found')
            });
            return;
        }

        if(job_referral.stage == body.stage){
            res.status(422).json({
                message : res.__('referral_stage_already_at' , {stage : body.stage})
            });
            return;
        }


        db.job_referral.update({
            stage : body.stage
        } , {
            where : {
                id : id
            }
        })
        .then(async (updateStatus)=>{
            if(updateStatus){
                res.json({
                    message : res.__('referral_stage_updated')
                });
            }else{
                res.json({
                    message : res.__('referral_stage_update_failed')
                });
            }

                const pointsData = await pointsController.getPointsData();
                var reward_type , reward_value;
                if(body.stage.valueOf() === CONSTANTS.CONSTANTS.CANDIDATE_REFERRED){// 100 PTS
                    reward_type = CONSTANTS.CONSTANTS.POINTS;
                    reward_value = pointsData.points_for_job_referral;
                }else if(body.stage.valueOf() === CONSTANTS.CONSTANTS.APPLICATION_RECEIVED){// 300 PTS
                    reward_type = CONSTANTS.CONSTANTS.POINTS;
                    reward_value = pointsData.points_for_job_application_received;
                }else if(body.stage.valueOf() === CONSTANTS.CONSTANTS.UNDERGOING_INTERVIEW){// 1000 PTS
                    reward_type = CONSTANTS.CONSTANTS.POINTS;
                    reward_value = pointsData.points_for_job_candidate_interview_inprogress;
                }else{// candidate_selected -  DEFINED IN JOB
                    let job = await db.job.findOne({ where : { id : job_referral.jobId}})
                    reward_type = job.referral_success_reward_type;
                    reward_value = job.referral_success_reward_value;
                }
    
                db.wallet_transaction.create({
                    reward_type : reward_type,
                    reward_value : reward_value,
                    transaction_type : CONSTANTS.CONSTANTS.INCOMING,
                    userId : job_referral.employeeId,
                    transaction_source : CONSTANTS.CONSTANTS.JOB_REFERRAL,
                    jobReferralId : job_referral.id
                })
                .then((transResult)=>{
                    console.log(transResult);
                });
        });

    })   
    .catch((err)=>{
        console.log(err);
        next(err);
    })
})

module.exports = app;