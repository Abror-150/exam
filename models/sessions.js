const { DataTypes } = require('sequelize');
const { db } = require('../config/db');
const { string } = require('joi');

const Sessions = db.define('sessions', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  lastIp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  device: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Sessions;
