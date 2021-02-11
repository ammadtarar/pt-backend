const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const { reward_redemption_request } = require('../../../controllers/db.js');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);
const CONSTANTS = require('../../../models/constants');
const WALLET = require('./wallet.js');
const emailer = require('../../../controllers/emailer.js');
const { resolveContent } = require('nodemailer/lib/shared');

app.post('/create' , middleware.authenticateCompanyUser , (req , res , next)=>{

    if(!req.isSuperAdmin && req.user.user_type != CONSTANTS.CONSTANTS.HR_ADMIN){
        res.status(422).send({
            message: res.__('employee_not_allowed')
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

    var reward = underscore.pick(body , 'title' , 'points_required' , 'is_active');
    if(!body.hasOwnProperty('is_active')){
        reward.is_active = true
    };
    if(reward === null || reward === undefined  || Object.keys(reward).length != 3){
        res.status(422).send({
            message: res.__('reward_data_missing')
        });
        return;
    }

    reward.companyId = req.user.companyId;
    reward.hrId = req.user.id;

    db.reward.create(reward)
    .then((newReward)=>{
        res.json({
            message : res.__('reward_created_successfully'),
            reward : reward
        });
    })
    .catch((err)=>{
        next(err);
    });

});

app.patch('/:id' , middleware.authenticateCompanyUser , (req , res , next)=>{
    if(!req.isSuperAdmin && req.user.user_type != CONSTANTS.CONSTANTS.HR_ADMIN){
        res.status(422).send({
            message: res.__('employee_not_allowed')
        });
        return;
    }

    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('reward_id_missing')
        });
        return;
    }

    

    db.reward.findOne({
        where : {
            id : id
        }
    })
    .then((reward)=>{
        if(!reward){
            res.status(404).json({
                message : res.__('reward_missing')
            });
            return
        }else if(reward.companyId != req.user.companyId){
            res.status(401).json({
                message : res.__('reward_not_from_your_company')
            });
            return
        }else{
            var rewardUpdate = underscore.pick(req.body , 'title' , 'points_required' , 'is_active');
            db.reward.update(rewardUpdate , {
                where : {
                    id : id
                }
            })
            .then((updateStatus)=>{
                if(updateStatus){
                    res.json({
                        message : res.__('reward_updated_successfully')
                    });
                }else{
                    res.json({
                        message : res.__('reward_update_failed')
                    });
                }
            });
        }
    })
    .catch((err)=>{
        next(err);
    });




});


app.get('/list/all' , middleware.authenticate , (req , res , next)=>{

    var limit = parseInt(req.query.limit) || 10;
    var page = parseInt(req.query.page) || 0;
    if (page >= 1) {
        page = page - 1;
    }

    var where = {};

    if(!req.isSuperAdmin){
        where.companyId = req.user.companyId;
        if(req.user.user_type == CONSTANTS.CONSTANTS.EMPLOYEE){
            where.is_active = true
        }else if(req.query.hasOwnProperty("is_active")){
            where.is_active = req.query.is_active === 'true';
        }
    
    }else{
        if(req.query.hasOwnProperty("is_active")){
            where.is_active = req.query.is_active === 'true';
        }
    }

    let title = req.query.title || '';
    if(title !== null && title !== undefined && title != ''){
        where.title = {
            [db.Op.like]: '%' + title + '%'
        }
    }
    

    db.reward.findAndCountAll({
        where : where,
        limit: limit,
        offset: limit * page,
        order: [
            ['createdAt', 'DESC']
        ],
        include: [{
            model: db.company,
            as: "company"
        }, {
            model : db.user,
            as : 'hr',
            attributes : {
                exclude : ['salt', 'password_hash', 'tokenHash' , 'companyId' , 'last_active_time' ]
            }
        }],
        attributes : {
            exclude : ['hrId' , 'companyId']
        }
    })
    .then((rewards) => {
        res.json(rewards);
    })
    .catch((err) => {
        next(err);
    });
});


app.get('/redeem/requests/list/all' , middleware.authenticate , (req , res , next)=>{
    var limit = parseInt(req.query.limit) || 10;
    var page = parseInt(req.query.page) || 0;
    if (page >= 1) {
        page = page - 1;
    }

    var where = {};

    if(!req.isSuperAdmin){
        where.companyId = req.user.companyId;
        if(req.user.user_type == CONSTANTS.CONSTANTS.EMPLOYEE){
            where.is_active = true
        }else if(req.query.hasOwnProperty("is_active")){
            where.is_active = req.query.is_active === 'true';
        }
    
    }else{
        if(req.query.hasOwnProperty("is_active")){
            where.is_active = req.query.is_active === 'true';
        }
    }

    db.reward_redemption_request.findAndCountAll({
        where : where,
        limit: limit,
        offset: limit * page,
        order: [
            ['createdAt', 'DESC']
        ],
        include : [
            {
                model : db.user,
                as : 'employee',
                attributes : {
                    exclude : ['salt', 'password_hash', 'tokenHash' , 'companyId' , 'last_active_time' ]
                }
            },
            {
                model : db.reward,
                as : 'reward',
                attributes : {
                    exclude : ['hrId', 'companyId']
                }
            }
        ]
    })
    .then((requests)=>{
        res.json(requests);
    })
    .catch((err)=>{
        next(err);
    })
});

app.post('/:id/redeem' , middleware.authenticateCompanyUser , (req , res , next)=>{

    if(req.isSuperAdmin || (!req.isSuperAdmin && req.user.user_type === CONSTANTS.CONSTANTS.HR_ADMIN)){
        res.status(422).send({
            message: res.__('only_employee_allowed')
        });
        return;
    }

    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('reward_id_missing')
        });
        return;
    }

    db.reward.findOne({
        where : {
            id : id
        }
    })
    .then((reward)=>{
        if(!reward){
            res.status(404).json({
                message : res.__('reward_missing')
            });
        }else if(reward.companyId != req.user.companyId){
            res.status(401).json({
                message : res.__('reward_not_from_your_company')
            });
        }else{

            
            getUserBalance(req.user.id)
            .then((wallet)=>{

                if(wallet.points_balance < reward.points_required){
                    res.status(404).json({
                        message : res.__('not_enough_points')
                    });
                }else{
                    db.reward_redemption_request.findOne({
                        where : {
                            rewardId : id,
                            employeeId : req.user.id
                        }
                    })
                    .then((redeemRequest)=>{
                        

                        if(redeemRequest){
                            res.status(409).json({
                                message : res.__('reward_already_redeemed')
                            })
                        }else{
                
                            db.reward_redemption_request.create({
                                rewardId : id,
                                employeeId : req.user.id,
                                status : CONSTANTS.CONSTANTS.REQUESTED
                            })
                            .then((reward_request)=>{
                                res.json({
                                    message : res.__('reward_request_successful'),
                                    reward_request : reward_request
                                });

                                db.user.findOne({
                                    where : {
                                        id : reward.hrId
                                    }
                                })
                                .then((hr)=>{
                                    emailer.sendRewardRequestToHR(req.user , reward , hr)
                                });
                                

                            });
                        }
                    })
                }
            });
            

        }
    })
    .catch((err)=>{
        next(err);
    });
    
});



app.post('/redeem/:id/approve' , middleware.authenticateCompanyUser , (req , res , next)=>{
    if(req.isSuperAdmin || (!req.isSuperAdmin && req.user.user_type === CONSTANTS.CONSTANTS.EMPLOYEE)){
        res.status(422).send({
            message: res.__('only_company_hr_allowed')
        });
        return;
    }

    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('reward_id_missing')
        });
        return;
    }

    db.reward_redemption_request.findOne({
        where : {
            id : id
        },
        include : [
            {
                model : db.reward,
                as : 'reward'
            },
            {
                model : db.user,
                as : 'employee'
            }
        ]
    })
    .then((redeemRequest)=>{
        if(!redeemRequest){
            res.status(404).json({
                message : res.__('redeem_request_not_found')
            });
        }else if(redeemRequest.reward.companyId != req.user.companyId){
            res.status(401).json({
                message : res.__('reward_not_from_your_company')
            });  
        }else if(redeemRequest.status === CONSTANTS.CONSTANTS.APPROVED){
            res.status(401).json({
                message : res.__('redeem_request_already_approved')
            });
        }else{
            db.reward_redemption_request.update({
                status : CONSTANTS.CONSTANTS.APPROVED
            } , {
                where : {
                    id : id
                }
            })
            .then((updateRes)=>{
                db.wallet_transaction.create({
                    reward_type : CONSTANTS.CONSTANTS.POINTS,
                    reward_value : redeemRequest.reward.points_required,
                    transaction_type : CONSTANTS.CONSTANTS.OUTGOING,
                    userId : redeemRequest.employeeId,
                    transaction_source : CONSTANTS.CONSTANTS.REWARD_CLAIM,
                    rewardRedemptionRequestId : redeemRequest.id
                })
                .then((walletUpdateResponse)=>{
                    res.json({
                        updateRes : updateRes,
                        walletUpdateResponse : walletUpdateResponse
                    });

                    emailer.sendRedeemApprovalEmailToEmployee(redeemRequest.employee , redeemRequest.reward)
                });
            });
            
        }
    }).
    catch((err)=>{
        next(err);
    });


    
});


module.exports = app;