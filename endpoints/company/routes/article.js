const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);



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


module.exports = app;