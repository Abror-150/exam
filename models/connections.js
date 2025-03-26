<<<<<<< HEAD
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
  as: 'professions',
});
Profession.belongsTo(LearningCenter, {
  foreignKey: 'learningCenterId',
  as: 'userLearningCenter',
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
=======
const LearningCenter = require("./learningCenter");
const Users = require("./user");
const Region = require("./regions");
const Comments = require("./comment");
const Branch = require("./branches");
const ResourceCategory = require("./resourceCategory");
const CourseRegister = require("./courseRegister");
const Resource = require("./resource");
const Like = require("./likes");
const Fields = require("./fields");
const Profession = require("./professions");
const Subject = require("./subjects");
const SubCenter = require("./subCenter");

LearningCenter.hasMany(Users, { foreignKey: "learningCenterId" });
Users.belongsTo(LearningCenter, { foreignKey: "learningCenterId" });

Users.hasMany(Comments, { foreignKey: "userId" });
Comments.belongsTo(Users, { foreignKey: "userId" });

LearningCenter.hasMany(Comments, { foreignKey: "learningCenterId" });
Comments.belongsTo(LearningCenter, { foreignKey: "learningCenterId" });

// LearningCenter.belongsToMany(Branches, {
//   through: CourseRegister,
//   foreignKey: "learningCenterId",
// });
// Branches.belongsToMany(LearningCenter, {
//   through: CourseRegister,
//   foreignKey: "branchId",
// });
// Regions.hasMany(LearningCenter, { foreignKey: "regionId", as: "markazlar" });
// LearningCenter.belongsTo(Regions, { foreignKey: "regionId", as: "region" });

// LearningCenter.hasMany(Branches, {
//   foreignKey: "learningCenterId",
//   as: "branches",
// });
// Branches.belongsTo(LearningCenter, {
//   foreignKey: "learningCenterId",
//   as: "markaz",
// });
// LearningCenter.hasMany(Branches, { foreignKey: "learningCenterId" });
// Branches.belongsTo(LearningCenter, { foreignKey: "learningCenterId" });
LearningCenter.hasMany(Branch, { foreignKey: "learningCenterId" });
Branch.belongsTo(LearningCenter, { foreignKey: "learningCenterId" });

Region.hasMany(LearningCenter, { foreignKey: "regionId" });
LearningCenter.belongsTo(Region, { foreignKey: "regionId" });

Region.hasMany(Branch, { foreignKey: "regionId" });
Branch.belongsTo(Region, { foreignKey: "regionId" });

ResourceCategory.hasMany(Resource, { foreignKey: "resourceCategoryId" });
Resource.belongsTo(ResourceCategory, { foreignKey: "resourceCategoryId" });

Users.hasMany(Like, { foreignKey: "userId" });
Like.belongsTo(Users, { foreignKey: "userId" });

LearningCenter.hasMany(Like, { foreignKey: "learningCenterId" });
Like.belongsTo(LearningCenter, { foreignKey: "learningCenterId" });

Profession.belongsToMany(LearningCenter, {
  through: Fields,
  foreignKey: "professionId",
  as: "markaz",
});


LearningCenter.belongsToMany(Profession, {
  through: Fields,
  foreignKey: "learningCenterId",
  as: "kasblar",
});


Subject.belongsToMany(LearningCenter, {
  through: SubCenter,
  foreignKey: "subjectId",
  as: "markazlar",
});

LearningCenter.belongsToMany(Subject, {
  through: SubCenter,
  foreignKey: "learningCenterId",
  as: "fanlar",
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
>>>>>>> 46400bdd2d6dde03b75818d4bc3f3166d64603ac
