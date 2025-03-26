const { DataTypes } = require('sequelize');
const { db } = require('../config/db');
const Resource = require('./resource');

const ResourceCategory = db.define('ResourceCategorys', {
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

ResourceCategory.hasMany(Resource, { foreignKey: 'resourceCategoryId' });
Resource.belongsTo(ResourceCategory, { foreignKey: 'resourceCategoryId' });

module.exports = ResourceCategory;
