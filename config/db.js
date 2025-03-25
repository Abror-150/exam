const { Sequelize } = require('sequelize');

const db = new Sequelize('edu', 'root', 'abror.08082008', {
  host: 'localhost',
  dialect: 'mysql',
});
async function connectedDb() {
  try {
    await db.authenticate();
    console.log('connected db');
    // await db.sync({ force: true });
    // console.log('sync connected');
  } catch (error) {
    console.log(error);
  }
}

module.exports = { connectedDb, db };
