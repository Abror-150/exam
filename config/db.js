const { Sequelize } = require('sequelize');

const db = new Sequelize('education', 'root', '1234', {
  host: 'localhost',
  dialect: 'mysql',
});
async function connectedDb() {
  try {
    await db.authenticate();
    console.log('connected db');
    // await db.sync({ force: true });
    // console.log('ulandi ');
  } catch (error) {
    console.log(error);
  }
}

module.exports = { connectedDb, db };
