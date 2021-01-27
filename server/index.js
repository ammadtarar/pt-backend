const express = require('express');
const db = require('../controllers/db.js');
const middleware = require('../controllers/middleware.js')(db);

const server = express();

server.use(middleware.accessControl)

server.use(express.json());
server.use(express.urlencoded());


server.use(middleware.logger);
server.use(middleware.errorHandler);

module.exports = server;