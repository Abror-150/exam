const { DataTypes } = require('sequelize');
const { db } = require('../config/db');
const Users = require('./user');
const LearningCenter = require('./learningCenter');
const Profession = require('./professions');
const Branch = require('./branches');
const CourseRegister = db.define('courseRegisters', {
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

module.exports = CourseRegister;
