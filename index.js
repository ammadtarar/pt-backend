// require('dotenv').config();

require('custom-env').env(true)
require('./models/errors/custom-error');

const PORT = process.env.PORT || 3001;

console.log(`Your port is ${PORT}`);
const force = process.env.FORCE || false;

const app = require('./server');
const db = require('./controllers/db.js');



db.sequelize.sync({
    force: force
}).then(function() {
    app.listen(PORT, function() {
        console.log('Express listening on PORT ' + PORT + ' ! ');
        console.log("FORCE = ", force);
        if (force) {
            createRootAdmin();
        }
        // db.otp.create({
        //     code : '123456',
        // })
        // .then((otp)=>{
        //     console.log();
        //     console.log();
        //     console.log("================================");
        //     console.log("=== OTP CREATE ===");
        //     console.log("================================");
        //     console.log(JSON.parse(JSON.stringify(otp)));
        //     console.log("================================");
        //     console.log();
        //     console.log();
        // })
    });
});

function createRootAdmin() {
    db.super_admin.create({
            email: 'root@pushtalents.com',
            password: 'root@pushtalents',
            name: 'Root'
        })
        .then(function(admin) {
            console.log();
            console.log();
            console.log("================================");
            console.log("=== ROOT SUPER ADMIN CREATED ===");
            console.log("================================");
            console.log(JSON.parse(JSON.stringify(admin)));
            console.log("================================");
            console.log();
            console.log();
        });
}