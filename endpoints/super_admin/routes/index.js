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
                message: "Super admin registered successfully",
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
                message: "Login successful",
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
            message: "Please send new_password in request body"
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
                    message: "Password changed successfully"
                });
            } else {
                res.json({
                    message: "Failed to change password"
                });
            }
        })
        .catch((err) => {
            next(err);
        });

});

module.exports = app;