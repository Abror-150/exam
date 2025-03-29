// const winston = require("winston");
// const { combine, json, timestamp } = winston.format;
// require("winston-mongodb");

// let logger = winston.createLogger({
//   level: "silly",
//   format: combine(timestamp(), json()),
//   transports: [
//     new winston.transports.Console(),
//     new winston.transports.File({ filename: "loglar.log" }),
//     new winston.transports.MongoDB({
//       collection: "loglar",
//       db: "mongodb+srv://shukrullayevikromxon:TvsJZnNVyZhWC6cw@educenter.ylo3aih.mongodb.net/?retryWrites=true&w=majority&appName=educenter",
//     }),
//   ],
// });
// const getRouteLogger = (moduleName) => logger.child({ module: moduleName });
// module.exports = { logger, getRouteLogger };

const winston = require('winston');
const { combine, json, timestamp } = winston.format;
require('winston-mongodb').MongoDB;

let logger = winston.createLogger({
  level: 'silly',
  format: combine(timestamp(), json()),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'loglar.log' }),
    new winston.transports.MongoDB({
      db: 'mongodb+srv://shukrullayevikromxon:TvsJZnNVyZhWC6cw@educenter.ylo3aih.mongodb.net/?retryWrites=true&w=majority&appName=educenter',
      collection: 'loglar',
      options: {
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsInsecure: false,
        tlsCertificateKeyFile: undefined,
        useUnifiedTopology: true,
        useNewUrlParser: true,
      },
    }),
  ],
});

const getRouteLogger = (moduleName) => logger.child({ module: moduleName });
module.exports = { logger, getRouteLogger };
