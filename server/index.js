const express = require("express");

const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const server = express();

// or using CommonJS
// const express = require('express');
// const Sentry = require('@sentry/node');
// const Tracing = require("@sentry/tracing");

Sentry.init({
  dsn: "https://73e2868bd45d45998d92de0541acbd7d@o910721.ingest.sentry.io/5845631",
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ server }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
server.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
server.use(Sentry.Handlers.tracingHandler());

// All controllers should live here
server.get("/", function rootHandler(req, res) {
  res.end("Hello world!");
});

// The error handler must be before any other error middleware and after all controllers
server.use(Sentry.Handlers.errorHandler());

// Optional fallthrough error handler
server.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

server.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

const db = require("../controllers/db.js");
const middleware = require("../controllers/middleware.js")(db);

let cors = require("cors");
server.use(cors());

server.use(express.json());
server.use(express.urlencoded());
server.use(middleware.logger);

const { I18n } = require("i18n");
const i18n = new I18n();
i18n.configure({
  staticCatalog: {
    en: require("../locales/en.json"),
    fr: require("../locales/fr.json"),
  },
  defaultLocale: "en",
});

server.use(i18n.init);

//ROUTES
server.use("/super_admin/", require("../endpoints/super_admin/routes"));
server.use("/company/", require("../endpoints/company"));
server.use("/dashbaord", require("../endpoints/dashboard/routes"));
server.use("/settings", require("../endpoints/settings/routes"));

server.use(middleware.errorHandler);

module.exports = server;
