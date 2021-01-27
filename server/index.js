const express = require('express');
const db = require('../controllers/db.js');
const middleware = require('../controllers/middleware.js')(db);

const server = express();

server.use(middleware.accessControl)

server.use(express.json());
server.use(express.urlencoded());



const super_admin_routes = require('../endpoints/super_admin/routes');

server.use('/super_admin/', super_admin_routes);

server.use(middleware.logger);
server.use(middleware.errorHandler);

module.exports = server;