const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);

app.post('/register', middleware.authenticateSuperAdmin, (req, res, next) => {
    let body = underscore.pick(req.body, 'email', "name", "password");
    db.super_admin.create(body)
        .then((user) => {
            res.json({
                message: res.__('admin_created'),
                user: user.toPublicJSON()
            });
        })
        .catch((err) => {
            next(err);
        });
});

app.post('/login', (req, res, next) => {
    const body = underscore.pick(req.body, 'email', 'password');
    var token, userInstance;
    db.super_admin.authenticate(body)
        .then((user) => {
            userInstance = user;
            token = user.generateToken('authentication');
            return db.super_admin.update({
                token: token
            }, {
                where: {
                    id: user.id
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

app.patch('/change_password', middleware.authenticateSuperAdmin, (req, res, next) => {
    const body = underscore.pick(req.body, 'new_password');
    if (body === null || body === undefined || Object.keys(body).length === 0 || body.new_password === null || body.new_password === undefined || body.new_password.length <= 0) {
        res.status(422).send({
            message: res.__('new_pwd_missing')
        });
        return
    }

    db.super_admin.update({
            password: body.new_password
        }, {
            where: {
                id: req.user.id
            }
        })
        .then((status) => {
            if (status) {
                res.json({
                    message: res.__('pwd_change_success')
                });
            } else {
                res.json({
                    message: res.__('pwd_change_fail')
                });
            }
        })
        .catch((err) => {
            next(err);
        });

});

app.get('/list/all', middleware.authenticateSuperAdmin, (req, res, next) => {
    var limit = parseInt(req.query.limit) || 10;
    var page = parseInt(req.query.page) || 0;
    if (page >= 1) {
        page = page - 1;
    }


    db.super_admin.findAndCountAll({
            limit: limit,
            offset: limit * page,
            order: [
                ['createdAt', 'DESC']
            ],
            attributes: {
                exclude: ['salt', 'password_hash', 'tokenHash']
            },
        })
        .then((super_admins) => {
            res.json(super_admins);
        })
        .catch((err) => {
            next(err);
        })
});

module.exports = app;