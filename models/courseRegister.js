const { DataTypes } = require('sequelize');
const { db } = require('../config/db');

const CourseRegister = db.define('CourseRegisters', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  learningCenterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
 
});

module.exports = CourseRegister;
