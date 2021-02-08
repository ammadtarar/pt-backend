const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);
const CONSTANTS = require('../../../models/constants');


app.post('/create' , middleware.authenticate , async (req , res , next)=>{

    if(!req.body){
        res.status(422).send({
            message : res.__('body_data_missing')
        });
        return;
    }

    if(!req.body.url){
        res.status(422).send({
            message : res.__('article_url_missing')
        });
        return;
    }

    var data = {
        original_url : req.body.url
    };

    if(req.isSuperAdmin && !req.body.companyId){
        res.status(422).send({
            message : res.__('company_id_missing')
        });
        return;
    }else if(req.isSuperAdmin && req.body.companyId){
        data.companyId = req.body.companyId;
    }else{
        data.companyId = req.user.companyId;
    }



    
    if(req.body.hasOwnProperty("custom") && req.body.custom){

        if(!req.body.title || !req.body.thumb_url){
            res.status(422).send({
                message : res.__('article_custom_data_missing')
            });
            return
        }
        data.title = req.body.title;
        data.thumb_url = req.body.thumb_url;
        data.is_active = req.body.hasOwnProperty('is_active') ? (req.query.is_active === 'true') : true

    }else{

        let url_data = await require('html-metadata-parser').parser(data.original_url);
        if(url_data.err){
            res.status(404).json({
                message : res.__('article_data_cannot_be_fetched')
            })
        }else{
            data.title = url_data.og.title;
            data.thumb_url = url_data.og.image;
            data.is_active = req.body.hasOwnProperty('is_active') ? (req.query.is_active === 'true') : true
        }

    }

    db.article.create(data)
    .then((createdArticle)=>{
        createdArticle.saveInternalUrl()
        .then((internalUrl)=>{
            createdArticle.internal_url = internalUrl;  
            res.json({
                message : res.__('article_created_successfully'),
                article : createdArticle
            });
        });
        
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


    if(req.query.hasOwnProperty("is_active")){
        where.is_active = req.query.is_active === 'true';
    }

    let title = req.query.title;
    if(title){
        where.title = {
            [db.Op.like]: '%' + title + '%'
        }
    }

    let url = req.query.url;
    if(url){
        where.url = {
            [db.Op.like]: '%' + url + '%'
        }
    }

    let thumb_url = req.query.thumb_url;
    if(thumb_url){
        where.thumb_url = {
            [db.Op.like]: '%' + thumb_url + '%'
        }
    }

    db.article.findAndCountAll({
        where : where,
        limit: limit,
        offset: limit * page,
        order: [
            ['createdAt', 'DESC']
        ],
        include: [{
            model: db.company,
            as: "company"
        }],
        attributes : {
            exclude : ['companyId']
        }
    })
    .then((articles) => {
        res.json(articles);
    })
    .catch((err) => {
        next(err);
    });
});

app.get('/:id' , (req , res , next)=>{
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('article_id_missing')
        });
        return;
    }

    db.article.findOne({
        where : {
            id : id
        },
        include : [
            {
                model : db.company,
                as : 'company'
            }
        ],
        attributes : {
            exclude : ['companyId']
        }
    })
    .then((article)=>{
        res.json(article);
    })
    .catch((err)=>{
        next(err);
    })
});

app.post('/:id/generate/share/link' , middleware.authenticateCompanyUser , (req , res , next)=>{
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('article_id_missing')
        });
        return;
    }

    console.log(req.user);

    db.article_share.findOne({
        where : {
            employeeId : req.user.id,
            articleId : id
        }
    })
    .then((shareRes)=>{
        if(shareRes){
            res.json({
                message : res.__('article_share_link_generated'),
                shareId : shareRes.id,
                url : process.env.BASE_URL + 'company/article/share/' + String(shareRes.id)
            });
        }else{
            db.article_share.create({
                employeeId : req.user.id,
                articleId : id
            })
            .then((response)=>{
                res.json({
                    message : res.__('article_share_link_generated'),
                    shareId : response.id,
                    url : process.env.BASE_URL + 'company/article/share/' + String(response.id)
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
            message: res.__('article_id_missing')
        });
        return;
    }

    db.article_share.findOne({
        where : {
            id : id
        },
        include : [
            {
                model : db.article,
                as : "article"
            }

        ]
    })
    .then((response)=>{
        if(response){
            response.updateViewCount();
            res.statusCode = 302;
            res.setHeader("Location", response.article.original_url);
            res.end();

            db.wallet_transaction.create({
                reward_type : CONSTANTS.CONSTANTS.POINTS,
                reward_value : 1,
                transaction_type : CONSTANTS.CONSTANTS.INCOMING,
                userId : response.employeeId,
                transaction_source : CONSTANTS.CONSTANTS.ARTICLE_CLICK,
                articleShareId : response.article.id
            })
            .then((walletTransaction)=>{
                console.log();
                console.log();
                console.log("======");
                console.log("Article share click points added to user wallet");
                console.log(walletTransaction);
                console.log();
                console.log();
            });

        }else{
            res.status(404).json({
                message : res.__("article_share_not_found" , {id : id})
            });
        }
    })
    .catch((err)=>{
        next(err);
    });
});


app.get('/share/:id/data' , middleware.authenticate , (req , res , next)=>{
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('article_id_missing')
        });
        return;
    }

    db.article_share.findOne({
        where : {
            id : id
        },
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
    })
    .then((response)=>{
        if(response){
            res.json(response)
        }else{
            res.status(404).json({
                message : res.__("article_share_not_found" , {id : id})
            });
        }
    })
    .catch((err)=>{
        next(err);
    });
});

module.exports = app;