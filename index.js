<<<<<<< HEAD
const express = require('express');
const { connectedDb } = require('./config/db');
const LikeRoutes = require('./routes/likes');
const ProfessionRoutes = require('./routes/professions');
const LearningCenterRoute = require('./routes/learningCenter');
const CommentsRoute = require('./routes/comments');
const BranchesRoute = require('./routes/branch');
const ResourceCategories = require('./routes/resourceCategory');
const ResourceRoute = require('./routes/resource');
const { swaggerUi, swaggerDocs } = require('./swagger');
const UsersRoute = require('./routes/user');
const RegionRoute = require('./routes/regions');
const SubjectRoute = require('./routes/subjects');
const uploadRoute = require('./routes/upload');
const CourseRegister = require('./routes/courseRegister');
=======
const express = require("express");
const { connectedDb } = require("./config/db");
const LikeRoutes = require("./routes/likes");
const ProfessionRoutes = require("./routes/professions");
const LearningCenterRoute = require("./routes/learningCenter");
const CommentsRoute = require("./routes/comments");
const BranchesRoute = require("./routes/branch");
const ResourceCategories = require("./routes/resourceCategory");
const ResourceRoute = require("./routes/resource");
const { swaggerUi, swaggerDocs } = require("./swagger");
const UsersRoute = require("./routes/user");
const RegionRoute = require("./routes/regions");
const SubjectRoute = require("./routes/subjects");
const CourseRegisterRoute = require("./routes/courseRegister");
const uploadRoute = require("./routes/upload");

>>>>>>> daf8f6ad3187f9a3f63efdeddd6eb4052036758a
const app = express();
app.use(express.json());

connectedDb();
<<<<<<< HEAD

app.use('/likes', LikeRoutes);
app.use('/professions', ProfessionRoutes);
app.use('/users', UsersRoute);
app.use('/regions', RegionRoute);
app.use('/subjects', SubjectRoute);
app.use('/learning-centers', LearningCenterRoute);
app.use('/comments', CommentsRoute);
app.use('/branches', BranchesRoute);
app.use('/resource-categories', ResourceCategories);
app.use('/course-register', ResourceCategories);
app.use('/resources', ResourceRoute);
app.use('/uploads', express.static('uploads'));
app.use('/upload', uploadRoute);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.listen(3000, () => console.log('server started on port 3000'));
=======
app.use("/course-register", CourseRegisterRoute);
app.use("/likes", LikeRoutes);
app.use("/professions", ProfessionRoutes);
app.use("/users", UsersRoute);
app.use("/regions", RegionRoute);
app.use("/subjects", SubjectRoute);
app.use("/learning-centers", LearningCenterRoute);
app.use("/comments", CommentsRoute);
app.use("/branches", BranchesRoute);
app.use("/resource-categories", ResourceCategories);
app.use("/resources", ResourceRoute);
app.use("/uploads", express.static("uploads"));
app.use("/upload", uploadRoute);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.listen(3000, () => console.log("server started on port 3000"));
>>>>>>> daf8f6ad3187f9a3f63efdeddd6eb4052036758a
