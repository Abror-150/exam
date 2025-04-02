const { DataTypes } = require('sequelize');
const { db } = require('../config/db');
const Profession = require('./professions');
const LearningCenter = require('./learningCenter');
const Field = db.define(
  'soxalar',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    learningCenterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    professionsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { tableName: 'soxalar' }
);

module.exports = Field;
