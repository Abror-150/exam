const { DataTypes } = require("sequelize");
const { db } = require("../config/db");

const Sessions = db.define("sessions", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON,
    allowNull: false,
  },
});

module.exports = Sessions;
