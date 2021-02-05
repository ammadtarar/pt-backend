const { Router } = require('express');
const app = Router();
const underscore = require('underscore');
const db = require('../../../controllers/db.js');
const middleware = require('../../../controllers/middleware.js')(db);


app.post('/create' , middleware.authenticate , (req , res , next)=>{
    
});


module.exports = app;