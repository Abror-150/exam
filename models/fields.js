const { DataTypes } = require("sequelize");
const { db } = require("../config/db");
const Field = db.define("soxalar", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  learningCenterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  professionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});
module.exports = Field;
