const { DataTypes } = require("sequelize");
const { db } = require("../config/db");
const Like = db.define("layklar", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  learningCenterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});
module.exports = Like;
