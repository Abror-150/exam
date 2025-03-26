const Branch = require('./branches');
const Comments = require('./comment');
const CourseRegister = require('./courseRegister');
const Field = require('./fields');
const LearningCenter = require('./learningCenter');
const Like = require('./likes');
const ProfessionBranch = require('./professionBranch');
const Profession = require('./professions');
const Region = require('./regions');
const Resource = require('./resource');
const ResourceCategory = require('./resourceCategory');
const SubBranch = require('./subBranch');
const SubCenter = require('./subCenter');
const Subject = require('./subjects');
const Users = require('./user');

LearningCenter.hasMany(Users, { foreignKey: 'learningCenterId', as: 'users' });

Users.hasMany(Comments, { foreignKey: 'userId' });
Comments.belongsTo(Users, { foreignKey: 'userId' });

LearningCenter.hasMany(Comments, { foreignKey: 'learningCenterId' });
Comments.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

Users.belongsTo(LearningCenter, {
  foreignKey: 'learningCenterId',
  as: 'learningcenters',
});
LearningCenter.hasMany(Branch, { foreignKey: 'learningCenterId' });
Branch.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

LearningCenter.hasMany(Profession, {
  foreignKey: 'learningCenterId',
  //   as: 'professions',
});
Profession.belongsTo(LearningCenter, {
  foreignKey: 'learningCenterId',
  //   as: 'userLearningCenter',
});

Region.hasMany(LearningCenter, { foreignKey: 'regionId' });
LearningCenter.belongsTo(Region, { foreignKey: 'regionId' });

Region.hasMany(Branch, { foreignKey: 'regionId' });
Branch.belongsTo(Region, { foreignKey: 'regionId' });

Users.hasMany(Like, { foreignKey: 'userId' });
Like.belongsTo(Users, { foreignKey: 'userId' });

LearningCenter.hasMany(Like, { foreignKey: 'learningCenterId' });
Like.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

Profession.belongsToMany(Branch, {
  through: ProfessionBranch,
  foreignKey: 'professionId',
});
Branch.belongsToMany(Profession, {
  through: ProfessionBranch,
  foreignKey: 'branchId',
});

LearningCenter.belongsToMany(Users, {
  through: CourseRegister,
  foreignKey: 'learningCenterId',
  as: 'registeredUser',
});
Users.belongsToMany(LearningCenter, {
  through: CourseRegister,
  foreignKey: 'userId',
  as: 'registeredCenter',
});

Subject.belongsToMany(LearningCenter, {
  through: SubCenter,
  foreignKey: 'subjectId',
});
LearningCenter.belongsToMany(Subject, {
  through: SubCenter,
  foreignKey: 'learningCenterId',
});

Subject.belongsToMany(Branch, {
  through: SubBranch,
  foreignKey: 'subjectId',
});
Branch.belongsToMany(Subject, {
  through: SubBranch,
  foreignKey: 'branchId',
});

LearningCenter.belongsToMany(Profession, {
  through: Field,
  foreignKey: 'learningCenterId',
});
Profession.belongsToMany(LearningCenter, {
  through: Field,
  foreignKey: 'professionId',
});

Users.hasMany(Resource, { foreignKey: 'userId' });

Resource.belongsTo(Users, { foreignKey: 'userId' });

ResourceCategory.hasMany(Resource, { foreignKey: 'resourceCategoryId' });
Resource.belongsTo(ResourceCategory, { foreignKey: 'resourceCategoryId' });

Users.hasMany(CourseRegister, {
  foreignKey: 'userId',
});

CourseRegister.belongsTo(Users, {
  foreignKey: 'userId',
});

