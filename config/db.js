const { Sequelize } = require('sequelize');

const db = new Sequelize('eduCenters', 'root', 'password', {
  host: 'localhost',
  dialect: 'mysql',
});
async function connectedDb() {
  try {
    await db.authenticate();
    console.log('connected db');
    require('../models/connections');
    // await db.sync({ alter: true });
    // console.log('ulandi ');
  } catch (error) {
    console.log(error);
  }
}

module.exports = { connectedDb, db };
