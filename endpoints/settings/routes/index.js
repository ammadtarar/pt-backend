const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);
const CONSTANTS = require('../../../models/constants');

app.get('' , middleware.authenticateSuperAdmin , (req , res , next) =>{
    db.settings.findOne({
        where : {
            id : 1
        }
    })
    .then(settings => {
        res.json(settings);
    })
    .catch(err => {
        next(err);
    })
});

app.patch('/update' , middleware.authenticateSuperAdmin , (req , res , next)=>{
    const body = underscore.pick(req.body , 'points_for_article_view' , 'points_for_job_referral' , 'points_for_job_application_received' , 'points_for_job_candidate_interview_inprogress');
    db.settings.update(
        body , {
            where : {
                id : 1
            }
        }
    )
    .then(response => {
        res.json({
            message :  res.__('settings_updated')
        })
    })
    .catch(err => {
        console.log("ERROR ");
        console.log(err);
        next(err);
    })
});

module.exports = app;