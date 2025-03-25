const express = require('express');
const { connectedDb } = require('./config/db');
const UsersRoute = require('./routes/user');
const LearningCenterRoute = require('./routes/learningCenter');
const RegionsRoute = require('./routes/region');
const CommentsRoute = require('./routes/comments');
const BranchesRoute = require('./routes/branch');
const app = express();
const setupSwagger = require('./swagger');
connectedDb();
app.use(express.json());
setupSwagger(app);
app.use('/users', UsersRoute);
app.use('/regions', RegionsRoute);
app.use('/learning-centers', LearningCenterRoute);
app.use('/comments', CommentsRoute);
app.use('/branches', BranchesRoute);

app.listen(3000, () => console.log('server started on port 3000'));
