const { DataTypes } = require('sequelize');
const { db } = require('../config/db');
const Region = require('./regions');
const LearningCenter = require('./learningCenter');
const Profession = require('./professions');
const ProfessionBranch = require('./professionBranch');

const Branch = db.define('Branches', {
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
    type: DataTypes.INTEGER,
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

module.exports = Branch;
