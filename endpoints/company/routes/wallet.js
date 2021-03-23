const { Router } = require('express');
const app = Router();
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);
const CONSTANTS = require('../../../models/constants');


app.get('/my/wallet/balance' , middleware.authenticateCompanyUser , (req , res , next)=>{
    if(req.user.user_type === CONSTANTS.CONSTANTS.HR_ADMIN){
        res.status(422).json({
            message : res.__('hr_admin_no_wallet')
        });
        return
    }
    getUserBalance(req.user.id)
    .then((balance)=>{
        res.json(balance);
    })
    .catch((err)=>{
        next(err);
    });
});

app.get('/:id/wallet/balance' , middleware.authenticateCompanyUser , (req , res , next)=>{

    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('user_id_missing')
        });
        return;
    }

    if(req.user.user_type === CONSTANTS.CONSTANTS.EMPLOYEE){
        res.status(422).json({
            message : res.__('employee_cannot_see_others_wallet')
        });
        return
    }

    db.user.findOne({
        where : {
            id : id,
            companyId : req.user.companyId
        }
    })
    .then((user)=>{
        if(user){
            getUserBalance(id)
            .then((balance)=>{
                res.json({
                    user : {
                        first_name : user.first_name,
                        last_name : user.last_name
                    },
                    balance : balance
                })
            });
        }else{
            res.status(404).json({
                message : res.__('user_not_found_with_id' , {id : id})
            })
        }
    })

    
});

app.get('/my/wallet/transactions/list/all' , middleware.authenticateCompanyUser , (req , res , next)=>{
    if(req.user.user_type === CONSTANTS.CONSTANTS.HR_ADMIN){
        res.status(422).json({
            message : res.__('hr_admin_no_wallet')
        });
        return
    }
    getUserWalletTransactions(req.user.id , req.query)
    .then((balance)=>{
        res.json(balance);
    })
    .catch((err)=>{
        next(err);
    });
    
});


app.get('/:id/wallet/transactions/list/all' , middleware.authenticateCompanyUser , (req , res , next)=>{

    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('user_id_missing')
        });
        return;
    }

    if(req.user.user_type === CONSTANTS.CONSTANTS.EMPLOYEE){
        res.status(422).json({
            message : res.__('employee_cannot_see_others_wallet')
        });
        return
    }

    db.user.findOne({
        where : {
            id : id,
            companyId : req.user.companyId
        }
    })
    .then((user)=>{
        if(user){
            getUserWalletTransactions(id , req.query)
            .then((transactions)=>{
                res.json({
                    user : {
                        first_name : user.first_name,
                        last_name : user.last_name
                    },
                    transactions : transactions
                })
            });
        }else{
            res.status(404).json({
                message : res.__('user_not_found_with_id' , {id : id})
            })
        }
    })

    
});



getUserBalance = (userId)=>{
    return new Promise((resolve , reject)=>{

        db.wallet_transaction.findAll({
            where : {
                userId : userId,
                reward_type : 'points'
            },
            attributes: [
                'transaction_type',
                [db.sequelize.fn('SUM', db.sequelize.col('reward_value')), 'total'],
    
            ],
            group: ['transaction_type'],
        })
        .then((pointsResult)=>{
            
            let points = JSON.parse(JSON.stringify(pointsResult))
            
            var points_incoming = 0 , points_outgoing = 0 , cash_incoming = 0 , cash_outgoing = 0; 
            points.forEach((element) => {
                if(element.transaction_type === 'incoming'){
                    points_incoming = element.total;
                }else{
                    points_outgoing = element.total;
                }
            });

            db.wallet_transaction.findAll({
                where : {
                    userId : userId,
                    reward_type : 'cash'
                },
                attributes: [
                    'transaction_type',
                    [db.sequelize.fn('SUM', db.sequelize.col('reward_value')), 'total'],
        
                ],
                group: ['transaction_type']
            })
            .then((cashResult)=>{
                let cash = JSON.parse(JSON.stringify(cashResult))
                cash.forEach(element => {
                    if(element.transaction_type == 'incoming'){
                        cash_incoming = element.total;
                    }else{
                        cash_outgoing = element.total;
                    }
                });
    
                resolve({
                    points_balance : points_incoming - points_outgoing,
                    cash_balance : cash_incoming - cash_outgoing
                })
        
            });
        })
        .catch((err)=>{
            reject(err);
        })

    });
};

getUserWalletTransactions = (userId , query)=>{
    return new Promise((resolve , reject)=>{
        var limit = parseInt(query.limit) || 10;
        var page = parseInt(query.page) || 0;
        if (page >= 1) {
            page = page - 1;
        }
    
        var where = {
            userId : userId,
        }
    
        let transaction_type = query.transaction_type;
        if(transaction_type){
            where.transaction_type = transaction_type;
        }
    
        let reward_type = query.reward_type;
        if(reward_type){
            where.reward_type = reward_type;
        }
    
        db.wallet_transaction.findAndCountAll({
            distinct:true,
            where : where,
            limit: limit,
            offset: limit * page,
            order: [
                ['createdAt', 'DESC']
            ],
    
            attributes : {
                exclude : ['userId' , 'articleShareId' , 'jobReferralId']
            },
            include : [{
                model : db.reward_redemption_request,
                attributes : {
                    exclude : ['rewardId', 'employeeId']
                },
                include : [
                    {
                        model : db.reward,
                        as : 'reward'
                    }
                ]
            },{
                model : db.job_referral,
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
                        as : 'candidate',
                        attributes : {
                            exclude : ['is_archived']
                        },
                    }
                ]
            }, {
                model : db.article_share,
                 include : [
            {
                model : db.article,
                as : "article",
                attributes : {
                    exclude : ['companyId']
                },
                include : [
                    {
                        model : db.company,
                        as : 'company'
                    }
                ]
            },
            {
                model : db.user,
                as : 'employee',
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
        ],
        attributes : {
            exclude : ['employeeId' , 'companyId' , 'articleId']
        }
            }]
        })
        .then((transactions)=>{
            resolve(transactions);
        })
        .catch((err)=>{
            reject(err);
        })
    });
};



getUserTotalPoints = (userId)=>{
    return new Promise((resolve , rejcet)=>{
        db.wallet_transaction.findAll({
            where : {
                userId : userId,
                reward_type : 'points',
                transaction_type : 'incoming'
            },
            attributes: [
                [db.sequelize.fn('SUM', db.sequelize.col('reward_value')), 'total']
            ]
        })
        .then(res => {
            var total = 0
            try{
                total = JSON.parse(JSON.stringify(res))[0].total
            }catch(e){
                console.log(e);
            }
            resolve(total)
        })
    });
}
module.exports = app;
module.getUserBalance = getUserBalance;
module.getUserTotalPoints = getUserTotalPoints;