require('custom-env').env(true)
const Sequelize = require('sequelize');
const { lastIndexOf } = require('underscore');


var sequelize;
console.log("process.env.NODE_ENV = ", process.env.NODE_ENV);
if (process.env.NODE_ENV == 'development') {
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USERNAME,
        process.env.DB_PASSWORD, {
            dialect: process.env.DB_DIALECT,
            storage: process.env.DB_FILE_PATH,
            operatorsAliases: false,
            logging: false
        });
} else {
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USERNAME,
        process.env.DB_PASSWORD, {
            host: process.env.DB_HOST,
            dialect: process.env.DB_DIALECT,
            port: process.env.DB_PORT,
            logging: true
        });
}


var db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Op = Sequelize.Op;

db.super_admin = sequelize.import('../models/super_admin.js');
db.company = sequelize.import('../models/company.js');

module.exports = db;