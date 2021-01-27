require('custom-env').env(true)
const Sequelize = require('sequelize');


var sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD, {
        dialect: process.env.DB_DIALECT,
        storage: process.env.DB_FILE_PATH,
        operatorsAliases: false,
        logging: false
    });

var db = {};

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.Op = Sequelize.Op;

db.super_admin = sequelize.import('../models/super-admin.js');


module.exports = db;