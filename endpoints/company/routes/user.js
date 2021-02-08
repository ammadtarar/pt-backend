const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);
const emailer = require('../../../controllers/emailer.js');

app.post('/create', middleware.authenticateSuperAdmin, (req, res, next) => {

    let body = req.body;
    if (body === null || body === undefined || Object.keys(body).length === 0) {
        res.status(422).send({
            message: res.__('body_data_missing')
        });
        return
    }

    let users_list = body.users_list;
    if (users_list === null || users_list === undefined || !Array.isArray(users_list) || users_list.length <= 0 ) {
        res.status(422).send({
            message: res.__('company_users_list_missing')
        });
        return
    }

    var found_error = false , error_msg = '' , formatted_users = [];
    users_list.forEach((user , index)=>{
        var u = underscore.pick(user , 'first_name' , 'last_name' , 'position' , 'email' , 'user_type' , 'companyId');
        if(user === null || user === undefined  || Object.keys(u).length < 6){
            error_msg = res.__('company_users_incorrect_data');
            found_error = true
            return
        }
        console.log(u);
        formatted_users.push(u);
    });

    if(found_error){
        res.status(422).send({
            message: error_msg
        });
        return
    }

    db.user.bulkCreate(formatted_users)
    .then((new_users)=>{
        res.json({
            message: res.__('users_created'),
            company: new_users
        });
    })
    .catch((err)=>{
        next(err);
    })

});

app.get('/list/all' , middleware.authenticateSuperAdmin , (req , res , next)=>{
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

    let user_type = req.query.user_type;
    if(user_type !== null && user_type !== undefined){
        where.user_type = user_type;
    }

    let first_name = req.query.first_name || '';
    if(first_name !== null && first_name !== undefined && first_name != ''){
        where.first_name = {
            [db.Op.like]: '%' + first_name + '%'
        }
    }

    let last_name = req.query.last_name || '';
    if(last_name !== null && last_name !== undefined && last_name != ''){
        where.last_name = {
            [db.Op.like]: '%' + last_name + '%'
        }
    }

    db.user.findAndCountAll({
            where : where,
            limit: limit,
            offset: limit * page,
            order: [
                ['createdAt', 'DESC']
            ],
            attributes: {
                exclude: ['salt', 'password_hash', 'tokenHash' , 'companyId']
            },
            include: [{
                model: db.company,
                as: "company"
            }]
        })
        .then((users) => {
            res.json(users);
        })
        .catch((err) => {
            next(err);
        });
});

app.get('/:id' , middleware.authenticateSuperAdmin , (req , res , next) => {
    db.user.findOne({
        where : {
            id : req.params.id
        },
        attributes: {
            exclude: ['salt', 'password_hash', 'tokenHash' , 'companyId']
        },
        include: [{
            model: db.company,
            as: "company"
        }]
    })
    .then((user)=>{
        res.json(user);
    })
    .catch((err)=>{
        next(err);
    });
});

app.post('/send/otp' , (req , res , next) => {
    let body = req.body;
    if (body === null || body === undefined || Object.keys(body).length === 0) {
        res.status(422).send({
            message: res.__('body_data_missing')
        });
        return
    }

    let email = body.email || '';
    if (email === null || email === undefined || email === '') {
        res.status(422).send({
            message: res.__('email_missing')
        });
        return
    }

    db.user.findOne({
        where : {
            email : email
        }
    })
    .then((user)=>{
        if(user){
            db.otp.update({ already_used: true}, {
                where: {
                    userId: {
                        [db.Op.in]: [user.id]
                    }
                }
            })
            .then((us)=>{
                db.otp.create({
                    code : String(Math.floor(1000 + Math.random() * 9000)),
                    userId : user.id
                })
                .then((otpRes)=>{

                    emailer.sendCompanyUserOtp(user.email , otpRes.code , user.first_name)
                    .then(function() {
                        res.json({
                            code : otpRes.code,
                            id : otpRes.id
                        });
                    });

                });
            });
        }else{
            res.status(404).send({
                message: res.__('email_not_found' , {email : email})
            });
        }
    })
    .catch((err)=>{
        next(err);
    });
});


app.post('/login', (req, res, next) => {
    const body = underscore.pick(req.body, 'email', 'otp');
    var token, userInstance;
    db.user.authenticateByOtp(body.email , body.otp , db.otp , res)
        .then((userRes) => {
            userInstance = userRes;
            token = userRes.generateToken('authentication');
            return db.user.update({
                token: token
            }, {
                where: {
                    id: userRes.id
                }
            });
        })
        .then((u) => {
            res.header('Authentication', token)
            var user = userInstance.toPublicJSON();
            user.token = token
            res.json({
                message: res.__('login_success'),
                user: user
            })
        })
        .catch((e) => {
            next(e);
        });
});

app.patch('/' , middleware.authenticateCompanyUser , (req , res , next)=>{
    var body = req.body;
    if(body === null || body === undefined || Object.keys(body).length <= 0){
        res.status(422).send({
            message: res.__('body_data_missing')
        });
        return
    }
    var newData = {};
    if(body.first_name && body.first_name !== '' && body.first_name ){
        newData.first_name = body.first_name
    }

    if(body.last_name && body.last_name !== '' && body.last_name ){
        newData.last_name = body.last_name
    }

    db.user.update(newData , {
        where : {
            id : req.user.id
        }
    })
    .then((status)=>{
        res.json({
            message: res.__('update_successful')
        })
    })
    .catch((err)=>{
        next(err)
    })

});


app.get('/my/profile' , middleware.authenticateCompanyUser , (req , res , next)=>{
    db.user.findOne({
        where : {
            id : req.user.id
        },
        attributes: {
            exclude: ['salt', 'password_hash', 'tokenHash' , 'companyId']
        },
        include: [{
            model: db.company,
            as: "company"
        }]
    })
    .then((user)=>{
        res.json(user)
    })
    .catch((err)=>{
        next(err)
    })
});


module.exports = app;