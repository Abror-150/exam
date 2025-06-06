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
const Sessions = require('./sessions');
const SubBranch = require('./subBranch');
const SubCenter = require('./subCenter');
const Subject = require('./subjects');
const Users = require('./user');

LearningCenter.hasMany(Users, { foreignKey: 'learningCenterId', as: 'users' });
Users.belongsTo(LearningCenter, {
  foreignKey: 'learningCenterId',
  as: 'markaz',
});

Users.hasMany(Comments, { foreignKey: 'userId' });
Comments.belongsTo(Users, { foreignKey: 'userId', as: 'user' });

LearningCenter.hasMany(Comments, { foreignKey: 'learningCenterId' });
Comments.belongsTo(LearningCenter, {
  foreignKey: 'learningCenterId',
});

// LearningCenter.hasMany(Users, { foreignKey: "learningCenterId", as: "users" });
// Users.belongsTo(LearningCenter, {
//   foreignKey: "learningCenterId",
//   as: "learningcenters",
// });
Comments.belongsTo(Branch, { foreignKey: 'branchId' });
SubCenter.belongsTo(Subject, { foreignKey: 'subjectId' });
SubCenter.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

LearningCenter.hasMany(Comments, { foreignKey: 'learningCenterId' });
Comments.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

LearningCenter.hasMany(Branch, { foreignKey: 'learningCenterId' });
Branch.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

// LearningCenter.hasMany(Profession, {
//   foreignKey: 'learningCenterId',
//   as: 'kasblar',
// });
// Profession.belongsTo(LearningCenter, {
//   foreignKey: 'professionId',
//   //   as: 'userLearningCenter',
// });

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
  as: 'centers',
});
LearningCenter.belongsToMany(Subject, {
  through: SubCenter,
  foreignKey: 'learningCenterId',
  as: 'subjects',
});

SubCenter.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subject' });
SubCenter.belongsTo(LearningCenter, {
  foreignKey: 'learningCenterId',
  as: 'markazs',
});

Subject.belongsToMany(Branch, {
  through: SubBranch,
  foreignKey: 'subjectId',
});
Branch.belongsToMany(Subject, {
  through: SubBranch,
  foreignKey: 'branchId',
  as: 'subjectslar',
});
Profession.belongsToMany(LearningCenter, {
  through: Field,
  as: 'learningcenters',

  foreignKey: 'professionsId',
});

LearningCenter.belongsToMany(Profession, {
  through: Field,
  as: 'kasblars',
  foreignKey: 'learningCenterId',
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

CourseRegister.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });
CourseRegister.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

Users.hasMany(Sessions, { foreignKey: 'userId' });
Sessions.belongsTo(Users, { foreignKey: 'userId' });

Field.belongsTo(Profession, { foreignKey: 'professionId' });
Field.belongsTo(LearningCenter, { foreignKey: 'learningCenterId' });

Profession.hasMany(Field, { foreignKey: 'professionsId' });
LearningCenter.hasMany(Field, { foreignKey: 'learningCenterId' });
