var bcrypt = require('bcrypt');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');

module.exports = function(sequelize, DataTypes) {
    var super_admin = sequelize.define('super_admin', {
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        salt: {
            type: DataTypes.STRING
        },
        password_hash: {
            type: DataTypes.STRING
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
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
            beforeValidate: function(super_admin, options) {
                // super_admin.email
                if (typeof super_admin.email === 'string') {
                    super_admin.email = super_admin.email.toLowerCase();
                }
            }
        }
    });


    super_admin.authenticate = function(body) {
        return new Promise(function(resolve, reject) {
            if (typeof body.email !== 'string' || typeof body.password !== 'string') {;
                reject({
                    status: 409,
                    message: "Please send both email and password in request body"
                });
            }
            super_admin.findOne({
                where: {
                    email: body.email
                }
            }).then(function(super_admin) {
                if (!super_admin || !bcrypt.compareSync(body.password, super_admin.get(
                        'password_hash'))) {
                    reject({
                        status: 401,
                        message: "Email or password is incorrect . Please make sure you enter a valid registered email with correct password"
                    });
                }
                resolve(super_admin);
            }, function(e) {
                reject();
            });
        });
    };


    super_admin.findByToken = function(token) {
        return new Promise(function(resolve, reject) {
            try {
                const decodedJWT = jwt.verify(token, process.env.super_admin_TOKEN_SECRET);
                const bytes = cryptojs.AES.decrypt(decodedJWT.token, process.env.super_admin_TOKEN_CRYPTO_SECRET);
                const tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

                super_admin.findById(tokenData.id).then(function(super_admin) {
                    if (super_admin) {
                        resolve(super_admin);
                    } else {
                        reject({
                            status: 401,
                            message: "super_admin not found. Please make sure the token is valid and super_admin exists"
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


    super_admin.prototype.generateToken = function(type) {
        try {
            var stringData = JSON.stringify({
                id: this.get('id'),
                type: type
            });
            var encryptedData = cryptojs.AES.encrypt(stringData, process.env.super_admin_TOKEN_CRYPTO_SECRET).toString();
            var token = jwt.sign({
                token: encryptedData
            }, process.env.super_admin_TOKEN_SECRET);
            return token;
        } catch (e) {
            throw e;
        }
    };

    super_admin.prototype.toPublicJSON = function() {
        var json = this.toJSON();
        return _.pick(json, 'id', 'email', 'createdAt', "name");
    };

    return super_admin;
};