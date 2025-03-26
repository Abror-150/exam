const { Sequelize } = require('sequelize');

<<<<<<< HEAD
const db = new Sequelize('edu', 'root', 'abror.08082008', {
=======
const db = new Sequelize('educenter', 'root', 'ikromxon03022005', {
>>>>>>> daf8f6ad3187f9a3f63efdeddd6eb4052036758a
  host: 'localhost',
  dialect: 'mysql',
});
async function connectedDb() {
  try {
    await db.authenticate();
    console.log('connected db');
    require('../models/connections');
    // await db.sync({ force: true });
    // console.log('ulandi ');
  } catch (error) {
    console.log(error);
  }
}

module.exports = { connectedDb, db };
