const { DataTypes } = require('sequelize');
const { db } = require('../config/db');
const LearningCenter = require('./learningCenter');
const SubCenter = require('./subCenter');
const Subject = db.define('fanlar', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  img: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});


module.exports = Subject;
