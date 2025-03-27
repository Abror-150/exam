const { DataTypes } = require('sequelize');
const { db } = require('../config/db');
const Users = require('./user');

const Resource = db.define('Resources', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  img: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  describtion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});


module.exports = Resource;
