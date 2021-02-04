var bcrypt = require('bcrypt');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');
const db = require('../controllers/db');
let allowed_user_types = ['hr_admin','employee'];
const moment = require('moment');

module.exports = function(sequelize, DataTypes) {
    var user = sequelize.define('user', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        first_name : {
            type : DataTypes.STRING,
            allowNull : false
        },
        last_name : {
            type : DataTypes.STRING,
            allowNull : false
        },
        position : {
            type : DataTypes.STRING,
            allowNull : true
        },
        user_type : {
            type : DataTypes.ENUM(allowed_user_types),
            values : allowed_user_types,
            defaultValue : allowed_user_types[0],
            set(value){
                if (!allowed_user_types.includes(value)) {
                    throw new EnumValidationError('incorrect user_type' , 'user_type' , allowed_user_types , value);
                }
                this.setDataValue('user_type', value);
            }
        },
        last_active_time : {
            type : DataTypes.DATE
        },
        salt: {
            type: DataTypes.STRING
        },
        password_hash: {
            type: DataTypes.STRING
        },
        password: {
            type: DataTypes.VIRTUAL,
            allowNull: false,
            validate: {
                len: [7, 100]
            },
            set: function(value) {
                var salt = bcrypt.genSaltSync(10);
                var hashedPassword = bcrypt.hashSync(value, salt);

                this.setDataValue('password', value);
                this.setDataValue('salt', salt);
                this.setDataValue('password_hash', hashedPassword);
            }
        },
        token: {
            type: DataTypes.VIRTUAL,
            allowNull: true,
            set: function(value) {
                var hash = cryptojs.MD5(value).toString();
                this.setDataValue('token', value);
                this.setDataValue('tokenHash', hash);
            }
        },
        tokenHash: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        hooks: {
            beforeValidate: function(user, options) {
                // user.email
                if (typeof user.email === 'string') {
                    user.email = user.email.toLowerCase();
                }
            }
        }
    });

    user.authenticateByOtp = function(email , otp , dbOtp , res){
        return new Promise(function(resolve , reject){
            if(typeof email !== 'string' || typeof otp !== 'string'){
                reject({
                    status : 409,
                    message : res.__('email_otp_missing')
                });
            }
            user.findOne({
                where : {
                    email : email
                }
            })
            .then(function(user){
                if(!user){
                    reject({
                        status: 401,
                        message: res.__('incorrect_email_otp')
                    });
                    return
                }
                dbOtp.findOne({
                    where : {
                        userId : user.id,
                        already_used : false
                    },
                    order: [ [ 'createdAt', 'DESC' ]]
                })
                .then(function(otps){
                    if(otps.code === otp){
                        if(moment(new Date().toISOString()).diff(moment(otps.expiry) , 'days') > 30){
                            reject({
                                status: 404,
                                message: res.__('otp_expired')
                            });
                            return
                        }
                        resolve(user);
                        dbOtp.update({
                            expiry: moment(new Date()).add(1 , 'month').toDate()
                        }, {
                            where : {
                                id : otps.id
                            }
                        })
                        .then(function(updateStatus){
                            console.log("OTP Expiry update status = " , updateStatus);
                        })

                        
                    }else{
                        reject({
                            status: 401,
                            message: res.__('incorrect_email_otp')
                        });
                    }
                },function(e) {
                    reject();
                });
            })
        });
    };


    user.findByToken = function(token) {
        return new Promise(function(resolve, reject) {
            try {
                const decodedJWT = jwt.verify(token, process.env.TOKEN_SECRET);
                const bytes = cryptojs.AES.decrypt(decodedJWT.token, process.env.CRYPTO_SECRET);
                const tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

                user.findById(tokenData.id).then(function(user) {
                    if (user) {
                        resolve(user);
                    } else {
                        reject({
                            status: 401,
                            message: "user not found. Please make sure the token is valid and user exists"
                        });
                    }
                }, function(e) {
                    reject(e);
                });
            } catch (e) {
                reject(e);
            }
        });
    };


    user.prototype.generateToken = function(type) {
        try {
            var stringData = JSON.stringify({
                id: this.get('id'),
                type: type
            });
            var encryptedData = cryptojs.AES.encrypt(stringData, process.env.CRYPTO_SECRET).toString();
            var token = jwt.sign({
                token: encryptedData
            }, process.env.TOKEN_SECRET);
            return token;
        } catch (e) {
            throw e;
        }
    };

    user.prototype.toPublicJSON = function() {
        var json = this.toJSON();
        return _.pick(json, 'id', 'email', 'createdAt', "first_name" , "last_name" , "position" );
    };

    return user;
};