const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const { article_share } = require('../../../controllers/db.js');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);
const CONSTANTS = require('../../../models/constants');
const pointsController = require('../../../controllers/pointsController');


const metascraper = require('metascraper')([
    require('metascraper-author')(),
    require('metascraper-date')(),
    require('metascraper-description')(),
    require('metascraper-image')(),
    require('metascraper-logo')(),
    require('metascraper-clearbit')(),
    require('metascraper-publisher')(),
    require('metascraper-title')(),
    require('metascraper-url')()
  ]);
const got = require('got');

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

    
    if(!req.body.hasOwnProperty("custom") || req.body.custom == false){
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
        try{
            const { body: html, url } = await got(data.original_url);
            const metadata = await metascraper({ html, url });
            data.title = metadata.title;
            data.thumb_url = metadata.image;
            data.is_active = req.body.hasOwnProperty('is_active') ? (req.query.is_active === 'true') : true
        }catch(e){
            res.status(432).json({
                message : res.__('article_data_cannot_be_fetched')
            })
            return
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
        })
        .catch((err)=>{
            next(err);
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

    if(req.isSuperAdmin && req.query.hasOwnProperty("companyId")){
        where.companyId = req.query.companyId;
    }else if(!req.isSuperAdmin){
        where.companyId = req.user.companyId;
    }


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

    let original_url = req.query.original_url;
    if(original_url){
        where.original_url = {
            [db.Op.like]: '%' + original_url + '%'
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
        },
        distinct:true
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
        article.updateViewCount();
        article.view_count = article.view_count + 1
        res.json(article);
    })
    .catch((err)=>{
        next(err);
    })
});


app.patch("/:id/update/status" , middleware.authenticate , (req , res , next)=>{
    var id = parseInt(req.params.id);
    if (id === undefined || id === null || id <= 0) {
        res.status(422).send({
            message: res.__('article_id_missing')
        });
        return;
    }


    if(!req.isSuperAdmin && req.user.user_type === CONSTANTS.CONSTANTS.EMPLOYEE){
        res.status(422).send({
            message: res.__('employee_not_allowed')
        });
        return;
    }

    let body = underscore.pick(req.body , 'is_active');
    if(!body || Object.keys(body).length != 1){
        res.status(422).send({
            message : res.__('body_data_missing')
        });
        return
    }

    db.article.update({
        is_active : body.is_active
    }, {
        where : {
            id : id
        }
    })
    .then(response=>{
        res.json({
            message : res.__('article_status_updated')
        })
    })
    .catch(err =>{
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
            .catch(err =>{
                next(err)
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
    .then(async (response)=>{
        if(response){

            const pointsData = await require('../../../controllers/pointsController').getPointsData();
            db.wallet_transaction.create({
                reward_type : CONSTANTS.CONSTANTS.POINTS,
                reward_value : pointsData.points_for_article_view,
                transaction_type : CONSTANTS.CONSTANTS.INCOMING,
                userId : response.employeeId,
                transaction_source : CONSTANTS.CONSTANTS.ARTICLE_CLICK,
                articleShareId : response.id
            })
            .then((walletTransaction)=>{
                console.log(`*** Article share (ID = ${response.id}) click points added to the wallet of user (ID = ${response.employeeId}. Transaction ID = ${walletTransaction.id})`);
                response.updateViewCount();
                response.article.updateViewCount();
                res.statusCode = 302;
                res.setHeader("Location", response.article.original_url);
                res.end();
            })
            .catch(err => {
                console.log(`Unable to add article share click points to the waller. Redirecting to the article URL.`)
                console.log(`Wallet Transaciton Object =`);
                console.log({
                    reward_type : CONSTANTS.CONSTANTS.POINTS,
                    reward_value : pointsData.points_for_article_view,
                    transaction_type : CONSTANTS.CONSTANTS.INCOMING,
                    userId : response.employeeId,
                    transaction_source : CONSTANTS.CONSTANTS.ARTICLE_CLICK,
                    articleShareId : response.id
                });
                console.log('Transaction Error = ');
                console.log(err);
                response.updateViewCount();
                response.article.updateViewCount();
                res.statusCode = 302;
                res.setHeader("Location", response.article.original_url);
                res.end();
            })

            


            

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