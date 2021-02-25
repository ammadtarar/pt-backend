// require('dotenv').config();

require("custom-env").env(true);
require("./models/errors/custom-error");

const PORT = process.env.PORT || 3001;

console.log(`Your port is ${PORT}`);
const force = process.env.FORCE || false;

const app = require("./server");
const db = require("./controllers/db.js");

db.sequelize
  .sync({
    force: force,
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log();
      console.log();
      console.log("=======================================");
      console.log(`=== APP IS LISTENING ON PORT : ${PORT} ===`);
      console.log("=======================================");
      console.log();
      console.log();
      if (force) {
        createRootAdmin();
        createSettings();
      }
    });
  });

// CREATES ROOT SUPER ADMIN
createRootAdmin = () => {
  return new Promise((resolve, reject) => {
    db.super_admin
      .create({
        email: "root@pushtalents.com",
        password: "root@pushtalents",
        name: "Root",
      })
      .then(admin => {
        console.log();
        console.log();
        console.log("================================");
        console.log("=== ROOT SUPER ADMIN CREATED ===");
        console.log("================================");
        console.log(JSON.parse(JSON.stringify(admin)));
        console.log("================================");
        console.log();
        console.log();
      })
      .catch(err => {
        console.log();
        console.log();
        console.log("======================================");
        console.log("=== ROOT SUPER ADMIN CRETION ERROR ===");
        console.log("======================================");
        console.error(err);
        console.log("======================================");
        console.log();
        console.log();
        reject(err);
      });
  });
};

// CREATES DEFAULT SETTINGS
createSettings = () => {
  return new Promise((resolve, reject) => {
    db.settings
      .create()
      .then(res => {
        console.log();
        console.log();
        console.log("===============================");
        console.log("=== DEFAULT SETTINGS CREATE ===");
        console.log("===============================");
        console.log(JSON.parse(JSON.stringify(res)));
        console.log("===============================");
        console.log();
        console.log();
        resolve(res);
      })
      .catch(err => {
        console.log();
        console.log();
        console.log("=======================================");
        console.log("=== DEFAULT SETTINGS CREATION ERROR ===");
        console.log("=======================================");
        console.error(err);
        console.log("=======================================");
        console.log();
        console.log();
        reject(err);
      });
  });
};
