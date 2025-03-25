const { DataTypes } = require('sequelize');
const { db } = require('../config/db');
const LearningCenter = require('./learningCenter');
const Branch = require('./branches');

const Region = db.define('Region', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Region.hasMany(LearningCenter, { foreignKey: 'regionId' });
// LearningCenter.belongsTo(Region, { foreignKey: 'regionId' });

// Region.hasMany(Branch, { foreignKey: 'regionId' });
// Branch.belongsTo(Region, { foreignKey: 'regionId' });

module.exports = Region;
