const { DataTypes } = require('sequelize');
const { db } = require('../config/db');
const Subject = require('./subjects');
const Branch = require('./branches');

const SubBranch = db.define('subjectBranches', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  subjectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  branchId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});
Subject.belongsToMany(Branch, {
  through: SubBranch,
  foreignKey: 'subjectId',
});
Branch.belongsToMany(Subject, {
  through: SubBranch,
  foreignKey: 'branchId',
});

module.exports = SubBranch;
