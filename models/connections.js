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
