const { DataTypes } = require('sequelize');
const { db } = require('../config/db');

const Comments = db.define('Comments', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  learningCenterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  star: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
 
});

module.exports = Comments;
