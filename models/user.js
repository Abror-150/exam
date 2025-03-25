const { DataTypes } = require('sequelize');
const { db } = require('../config/db');

const Users = db.define('users', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  img: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    type: DataTypes.ENUM('ADMIN', 'USER', 'SUPER_ADMIN', 'CEO'),
    allowNull: false,
    defaultValue: 'user',
  },
  status: {
    type: DataTypes.STRING,
  },
  lastIp: {
    type: DataTypes.STRING,
  },
});

module.exports = Users;
