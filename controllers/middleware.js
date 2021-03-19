var cryptojs = require('crypto-js');
const CONST = require("../models/constants").CONSTANTS;
const moment = require('moment');

setUserLastActiveTime = (db , userId) =>{
    return new Promise((resolve , reject)=>{
        db.user.update({
            last_active_time : new Date()
        }, {
            where : {
                id : userId
            }
        })
        .then(response => {
            resolve(response);
        })
        .catch(err => {
            console.log("=== ERROR");
            console.log(err);
            reject(err);
        })
    });
};



module.exports = function(db) {
    return {
        accessControl: function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods",
                "GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE");
            res.header("Access-Control-Allow-Headers",
                "Authorization,Content-Type,Accept,Origin,User-Agent,DNT,Cache-Control,X-Mx-ReqToken,Keep-Alive,X-Requested-With,If-Modified-Since,name,type"
            );
            next();
        },
        errorHandler: function(e, req, res, next) {
            if (e instanceof db.Sequelize.ForeignKeyConstraintError) {
                res.status(409).json({
                    message: "Incorrect ID passed. Please make sure the ID is valid and exists"
                })
            } else if (e instanceof db.Sequelize.ValidationError) {
                const messages = {};
                e.errors.forEach((error) => {
                    let message;
                    switch (error.validatorKey) {

                        case 'isEmail':
                            message = error.value + ' is not a valid email address. Please enter a valid email';
                            break;
                        case 'isDate':
                            message = 'Please enter a valid date';
                            break;
                        case 'len':
                            if (error.validatorArgs[0] === error.validatorArgs[1]) {
                                message = 'Use ' + error.validatorArgs[0] + ' characters for ' + error.path;
                            } else {
                                message = 'Use between ' + error.validatorArgs[0] + ' and ' + error.validatorArgs[1] + ' characters for ' + error.path;
                            }
                            break;
                        case 'min':
                            message = 'Use a number greater or equal to ' + error.validatorArgs[0] + 'for ' + error.path;
                            break;
                        case 'max':
                            message = 'Use a number less or equal to ' + error.validatorArgs[0] + 'for ' + error.path;
                            break;
                        case 'isInt':
                            message = 'Please use an integer number for ' + error.path;
                            break;
                        case 'is_null':
                            message = error.path + ' is required. Please complete ' + error.path + ' field';
                            break;
                        case 'not_unique':
                            message = error.value != null ? error.value + ' is taken. Please choose another ' + error.path : error.message;
                            break;
                        case 'isUrl':
                            message = error.value != null ? error.value + ' is not a valid value for ' + error.path : error.message;
                            break;
                    }
                    console.log("=== e ===");
                    console.log(e);
                    messages["message"] = message;
                });
                console.log("==e==");
                console.log(e);
                res.status(422).json(messages)
            } else if(e instanceof EnumValidationError){
                
                res.status(422).json({
                    message: res.__('not_a_valid_enum' , {value : e.enteredValue , field : e.field , allowed_values : e.allowedValues}) 
                })
            }else {
                console.log("");
                console.log("");
                console.log("=====");
                console.log("instance of = " , e.name);
                console.log(e);
                console.log(e.status);
                console.log(e.message);


                res.status(e.status || 500).json({
                    message: e.message
                })
            }
        },
        logger: function(req, res, next) {
            console.log("");
            console.log("");
            console.log("");
            console.log("===== NEW REQUEST =====");
            console.log(
                "Request : " +
                new Date().toString() +
                " " +
                req.method +
                " " +
                req.originalUrl
            );
            console.log("");
            console.log("");
            console.log("");
            console.log("");
            next();
        },
        authenticateSuperAdmin: function(req, res, next) {
            var token = req.get("Authorization") || "";
            if (token === undefined || token === "") {
                res.status(401).send({
                    message: res.__('token_missing')
                });
                return;
            }
            db.super_admin.findOne({
                    where: {
                        tokenHash: cryptojs.MD5(token).toString()
                    }
                })
                .then(function(user) {
                    
                    if (!user) {
                        res.status(401).send({
                            message: res.__('super_admin_not_found')
                        });
                        return;
                    }
                    req.user = user;
                    next();
                })
                .catch(function(err) {
                    console.log("admin error");
                    console.log(err);
                    res.status(401).send();
                });
        },
        authenticateCompanyUser: function(req , res , next){
            var token = req.get("Authorization") || "";
            if (token === undefined || token === "") {
                res.status(401).send({
                    message: res.__('token_missing')
                });
                return;
            }

            
            db.token.findOne({
                where : {
                    tokenHash : cryptojs.MD5(token).toString()
                },
                include : [{
                    model : db.user,
                    as : 'user',
                    include : [{
                        model : db.company,
                        as : 'company'
                    }]
                }]
            })
            .then(token => {
                if(!token){
                    res.status(409).send({
                        message: res.__('user_token_not_found')
                    });
                    return;
                }else if(token.user.status === 'archived'){
                    res.status(408).send({
                        message: res.__('user_archived')
                    });
                    return;
                }else if(moment(new Date().toISOString()).diff(moment(token.user.last_active_time || new Date().toISOString()) , 'days') > 30){
                    res.status(406).send({
                        message: res.__('session_time_out')
                    });
                    return;
                }



                var origin = req.get("client-name") || "hr_admin";
                if(origin != "hr_admin"){
                    console.log(" ORIGIN IN NOT HR ADMIN < UPDATING LAST ACTIVE TIME");
                    setUserLastActiveTime(db , token.user.id)
                }
                req.user = token.user;
                next();
            })
            .catch(function() {
                res.status(401).send();
            });
        },
        authenticate: function(req , res , next){
            var token = req.get("Authorization") || "";
            if (token === undefined || token === "") {
                res.status(401).send({
                    message: res.__('token_missing')
                });
                return;
            }

            console.log("token string");
            console.log(token);
            

            db.token.findOne({
                where : {
                    tokenHash : cryptojs.MD5(token).toString()
                },
                include : [{
                    model : db.user,
                    as : 'user',
                    include : [{
                        model : db.company,
                        as : 'company'
                    }]
                }]
            })
            .then(userTokenObject => {

                if(!userTokenObject){
                    console.log("HEllo");
                    db.super_admin
                    .findOne({
                        where: {
                            tokenHash: cryptojs.MD5(token).toString()
                        }
                    })
                    .then(function(companyUser) {
                        console.log("companyUser");
                        console.log(companyUser);
                        
                        if (!companyUser) {
                            res.status(401).send({
                                message: res.__('user_token_not_found')
                            });
                            return;
                        }
                        req.user = companyUser;
                        req.isSuperAdmin = true;
                        next();
                    })
                    .catch(function() {
                        res.status(401).send();
                    });
                    return;
                }else if(userTokenObject.user.status === 'archived'){
                    res.status(408).send({
                        message: res.__('user_archived')
                    });
                    return;
                }else if(moment(new Date().toISOString()).diff(moment(userTokenObject.user.last_active_time || new Date().toISOString()) , 'days') > 30){
                    res.status(406).send({
                        message: res.__('session_time_out')
                    });
                    return;
                }
                req.user = userTokenObject.user;
                var origin = req.get("client-name") || "hr_admin";
                if(origin != "hr_admin"){
                    console.log(" 1 - ORIGIN IN NOT HR ADMIN < UPDATING LAST ACTIVE TIME");
                    setUserLastActiveTime(db , userTokenObject.user.id)
                }
                next();
            })
            .catch(function() {
                res.status(401).send();
            });
        }
    };

};