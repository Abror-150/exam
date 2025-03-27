const winston = require("winston");
const { combine, json, timestamp } = winston.format;
require("winston-mongodb");

let logger = winston.createLogger({
  level: "silly",
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "loglar.log" }),
    new winston.transports.MongoDB({
      collection: "loglar",
      db: "mongodb://localhost:27017/lg",
    }),
  ],
});
const getRouteLogger = (moduleName)=>logger.child({module:moduleName})
module.exports = { logger, getRouteLogger };