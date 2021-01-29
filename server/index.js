const express = require('express');
const db = require('../controllers/db.js');
const middleware = require('../controllers/middleware.js')(db);

const server = express();

server.use(middleware.accessControl)

server.use(express.json());
server.use(express.urlencoded());

const { I18n } = require('i18n');
const i18n = new I18n();
i18n.configure({
    staticCatalog: {
        en: require('../locales/en.json'),
        fr: require('../locales/fr.json')
    },
    defaultLocale: 'en'
})

server.use(i18n.init)

//ROUTES
server.use('/super_admin/', require('../endpoints/super_admin/routes'));
server.use('/company/', require('../endpoints/company/routes'));

server.use(middleware.logger);
server.use(middleware.errorHandler);

module.exports = server;