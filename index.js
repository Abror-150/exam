const { connectedDb } = require("./config/db");
const LikeRoutes = require("./routes/likes");
const ProfessionRoutes = require("./routes/professions");
const LearningCenterRoute = require("./routes/learningCenter");
const CommentsRoute = require("./routes/comments");
const BranchesRoute = require("./routes/branch");

const { swaggerUi, swaggerDocs } = require("./swagger");
const UsersRoute = require("./routes/user");
const RegionRoute = require("./routes/regions");
const SubjectRoute = require("./routes/subjects");
const express = require("express");
const app = express();
app.use(express.json());

connectedDb();
app.use("/likes", LikeRoutes);
app.use("/professions", ProfessionRoutes);
app.use("/users", UsersRoute);
app.use("/regions", RegionRoute);
app.use("/subjects", SubjectRoute);
app.use("/learning-centers", LearningCenterRoute);
app.use("/comments", CommentsRoute);
app.use("/branches", BranchesRoute);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.listen(3000, () => console.log("server started on port 3000"));
// =======
// const express = require('express');
// const { connectedDb } = require('./config/db');
// const UsersRoute = require('./routes/user');
// const RegionsRoute = require('./routes/region');
// const app = express();
// const setupSwagger = require('./swagger');
// connectedDb();
// app.use(express.json());
// setupSwagger(app);
// app.use('/users', UsersRoute);
// app.use('/regions', RegionsRoute);
// app.use('/learning-centers', LearningCenterRoute);
// app.use('/comments', CommentsRoute);
// app.use('/branches', BranchesRoute);

// app.listen(3000, () => console.log('server started on port 3000'));
// >>>>>>> ddd00021c925c9565110e6c8144fe5f40a8c23c4
