const { DataTypes } = require('sequelize');
const { db } = require('../config/db');

const Branches = db.define('Branches', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  img: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  regionId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  learningCenterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Branches;
