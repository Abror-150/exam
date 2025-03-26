const { DataTypes } = require('sequelize');
const { db } = require('../config/db');
const LearningCenter = require('./learningCenter');
const Profession = require('./professions');
const SubCenter = db.define('subjectcenters', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  learningCenterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = SubCenter;
