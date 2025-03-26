const { DataTypes } = require('sequelize');
const { db } = require('../config/db');
const Branch = require('./branches');
const Profession = require('./professions');

const ProfessionBranch = db.define('ProfessionBranches', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  professionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = ProfessionBranch;
