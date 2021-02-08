const express = require('express');
const server = express();

//ROUTES
server.use('/', require('./routes/company.js'));
server.use('/user/', require('./routes/user.js'));
server.use('/job/', require('./routes/job.js'));
server.use('/article/', require('./routes/article.js'));
server.use('/user', require('./routes/wallet.js'));
server.use('/reward', require('./routes/reward.js'));

module.exports = server;