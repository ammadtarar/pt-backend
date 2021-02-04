const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);

app.post('/create', middleware.authenticateSuperAdmin, (req, res, next) => {
    let body = underscore.pick(req.body, 'name');
    if (body === null || body === undefined || Object.keys(body).length === 0 || body.name === null || body.name === undefined || body.name.length <= 0) {
        res.status(422).send({
            message: res.__('company_name_missing')
        });
        return
    }
    db.company.create(body)
        .then((company) => {
            res.json({
                message: res.__('company_created'),
                company: company
            });
        })
        .catch((err) => {
            next(err);
        })
});

app.get('/list/all', middleware.authenticateSuperAdmin, (req, res, next) => {
    var limit = parseInt(req.query.limit) || 10;
    var page = parseInt(req.query.page) || 0;
    if (page >= 1) {
        page = page - 1;
    }


    db.company.findAndCountAll({
            limit: limit,
            offset: limit * page,
            order: [
                ['createdAt', 'DESC']
            ]
        })
        .then((companoies) => {
            res.json(companoies);
        })
        .catch((err) => {
            next(err);
        })
});

app.patch('/:id/update', middleware.authenticateSuperAdmin, (req, res, next) => {
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('company_id_missing_params')
        });
        return;
    }

    let body = underscore.pick(req.body, 'name');
    if (body === null || body === undefined || Object.keys(body).length === 0 || body.name === null || body.name === undefined || body.name.length <= 0) {
        res.status(422).send({
            message: res.__('company_name_missing')
        });
        return
    }

    db.company.update({
            name: body.name
        }, {
            where: {
                id: id
            }
        })
        .then((status) => {
            if (status) {
                res.json({
                    message: res.__('company_name_updated')
                });
            } else {
                res.json({
                    message: res.__('company_name_update_failed')
                });
            }
        })
        .catch((err) => {
            next(err)
        });

});

app.delete('/:id', middleware.authenticateSuperAdmin, (req, res, next) => {
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('company_id_missing_params')
        });
        return;
    }
    db.company.destroy({
            where: {
                id: id
            }
        })
        .then((status) => {
            if (status) {
                res.json({
                    message: res.__('company_deleted_successfully')
                });
            } else {
                res.json({
                    message: res.__('company_delete_failed')
                });
            }
        })
        .catch((err) => {
            next(err);
        })
})

module.exports = app;