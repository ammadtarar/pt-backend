const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);
const emailer = require('../../../controllers/emailer.js');

app.post('/create' , middleware.authenticateSuperAdmin , (req , res , next)=>{
    
    let body = req.body;
    if (body === null || body === undefined || Object.keys(body).length === 0) {
        res.status(422).send({
            message: res.__('body_data_missing')
        });
        return;
    }

    var job = underscore.pick(body , 'url' , 'title' , 'location' , 'reward_point' , 'companyId');
    if(job === null || job === undefined  || Object.keys(job).length != 5){
        res.status(422).send({
            message: res.__('job_missing_data')
        });
        return;
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
  
    if(!req.isSuperAdmin && req.user.user_type != 'hr_admin'){
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

    let companyId = parseInt(req.query.companyId) || 0;
    if(companyId > 0){
        where.companyId = companyId;
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
            }]
        })
        .then((companies) => {
            res.json(companies);
        })
        .catch((err) => {
            next(err);
        });
    
});

app.patch('/:id' , middleware.authenticateSuperAdmin ,(req , res , next)=>{
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
            response.updateViewCount();
            response.view_count = response.view_count + 1
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
    if(!req.isSuperAdmin && req.user.user_type === 'hr_admin'){
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
                employeeId : req.user.id
            }
        })
        .then((referral)=>{
            let referralUrl = process.env.BASE_URL + 'company/job/referral/' + String(referral[0].id);
            res.json({
                message : res.__('job_referral_successful'),
                referralId : referral[0].id,
                referralUrl : referralUrl
            });

            emailer.sendCompanyUserOtp(candidate , req.user , referralUrl)
            .then(()=>{
                console.log();
                console.log();
                console.log("=====");
                console.log("Job referral email sent to candidate succcessfully");
                console.log("=====");
                console.log("=====");

            })
        });

    })
    .catch((err)=>{
        next(err);
    });

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

    
})

module.exports = app;