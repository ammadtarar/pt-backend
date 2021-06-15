// require('dotenv').config();

require("custom-env").env(true);
require("./models/errors/custom-error");

const PORT = process.env.PORT || 3001;

console.log(`Your port is ${PORT}`);
const force = process.env.FORCE || false;

const app = require("./server");
const db = require("./controllers/db.js");

console.log("FOCE = ", force);
db.sequelize
  .sync({
    force: process.env.NODE_ENV === "production" ? false : force,
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
      .then((admin) => {
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
      .catch((err) => {
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
      .then((res) => {
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
      .catch((err) => {
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

const emailer = require("./controllers/emailer.js");

async function sendEmails() {
  console.log("SENDING USER OTP EMAILS");
  await emailer.sendCompanyUserOtp("000000", {
    first_name: "Ammad",
    last_name: "Amjad",
    email: "ammadtarar@gmail.com",
    company: {
      name: "Sawa Technologies",
    },
  });

  console.log("SENDING HR OTP EMAIL");
  await emailer.sendHrOtp("123456", {
    first_name: "Ammad",
    last_name: "Amjad",
    email: "ammadtarar@gmail.com",
    company: {
      name: "Sawa Technologies",
    },
  });

  console.log("SENDING HR ACCOUNT CRETION EMAIL");
  await emailer.sendHrAccountCreationEmail(
    {
      first_name: "Ammad",
      last_name: "Amjad",
      email: "ammadtarar@gmail.com",
    },
    {
      name: "Sawa Technologies",
    }
  );

  console.log("SEND JOB REFERRAL EMAIL");
  await emailer.sendJobReferral(
    {
      email: "ammadtarar@gmail.com",
      first_name: "Ammad",
      last_name: "Tarar",
    },
    {
      company: {
        name: "Sawa Technologies",
      },
      first_name: "Ammad",
      last_name: "Amjad",
    },
    "https://www.pushtalents.com"
  );

  console.log("SEND  REWARD APPROVAL EMAIL");
  emailer.sendRedeemApprovalEmailToEmployee(
    {
      email: "ammadtarar@gmail.com",
      first_name: "Ammad",
    },
    {
      title: "Netflix One Month Subscription",
    }
  );

  console.log("SEND  REWARD REQUEST EMAIL TO HR");
  emailer.sendRewardRequestToHR(
    {
      first_name: "Tarar",
    },
    {
      title: "Lambo",
    },
    {
      email: "ammadtarar@gmail.com",
      fist_name: "Ammad",
    }
  );

  console.log("SEND USER ACC CREATION EMAIL");
  emailer.sendUserAccountCreationEmail(
    {
      email: "ammmadtarar@gmail.com",
      first_name: "Ammad",
    },
    {
      name: "Sawa Technologies",
    }
  );
}
