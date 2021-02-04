const express = require('express');
const server = express();

//ROUTES
server.use('/', require('./routes/company.js'));
server.use('/user/', require('./routes/user.js'));

module.exports = server;