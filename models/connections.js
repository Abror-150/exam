const LearningCenter = require('./learningCenter');
const Users = require('./user');
const Region = require('./regions');
const Comments = require('./comment');
const Branch = require('./branches');
const ResourceCategory = require('./resourceCategory');
const CourseRegister = require('./courseRegister');
const Resource = require('./resource');
const Like = require('./likes');
const Fields = require('./fields');
const Profession = require('./professions');
const Subject = require('./subjects');
const SubCenter = require('./subCenter');

LearningCenter.hasMany(Users, { foreignKey: 'learningCenterId' });
Users.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

Users.hasMany(Comments, { foreignKey: 'userId' });
Comments.belongsTo(Users, { foreignKey: 'userId' });

LearningCenter.hasMany(Comments, { foreignKey: 'learningCenterId' });
Comments.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

LearningCenter.hasMany(Branch, { foreignKey: 'learningCenterId' });
Branch.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

// LearningCenter.belongsToMany(Branch, {
//   through: CourseRegister,
//   foreignKey: 'learningCenterId',
// });
// Branch.belongsToMany(LearningCenter, {
//   through: CourseRegister,
//   foreignKey: 'branchId',
// });

Region.hasMany(LearningCenter, { foreignKey: 'regionId' });
LearningCenter.belongsTo(Region, { foreignKey: 'regionId' });

Region.hasMany(Branch, { foreignKey: 'regionId' });
Branch.belongsTo(Region, { foreignKey: 'regionId' });

// LearningCenter.hasMany(Branch, {
//   foreignKey: 'learningCenterId',
// });
// Branch.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

ResourceCategory.hasMany(Resource, { foreignKey: 'resourceCategoryId' });
Resource.belongsTo(ResourceCategory, { foreignKey: 'resourceCategoryId' });

Users.hasMany(Like, { foreignKey: 'userId' });
Like.belongsTo(Users, { foreignKey: 'userId' });

// LearningCenter.hasMany(Like, { foreignKey: 'learningCenterId' });
// Like.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

// LearningCenter.belongsToMany(Profession, {
//   through: Fields,
//   foreignKey: 'learningCenterId',
// });
// Profession.belongsToMany(LearningCenter, {
//   through: Fields,
//   foreignKey: 'professionId',
// });

Subject.belongsToMany(LearningCenter, {
  through: SubCenter,
  foreignKey: 'subjectId',
});
LearningCenter.belongsToMany(Subject, {
  through: SubCenter,
  foreignKey: 'learningCenterId',
});

module.exports = {
  Users,
  Resource,
  Region,
  LearningCenter,
  Subject,
  SubCenter,
  Profession,
  Like,
  Fields,
  ResourceCategory,
  CourseRegister,
  Branch,
  Comments,
};
