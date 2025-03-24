const { DataTypes } = require("sequelize");
const { db } = require("../config/db");
const SubCenter = db.define("subjectcenters", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
module.exports = SubCenter;
