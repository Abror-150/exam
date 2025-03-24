const express = require('express');
const { connectedDb } = require('./config/db');
const UsersRoute = require('./routes/user');
const app = express();
connectedDb();
app.use(express.json());

app.use('/users', UsersRoute);

app.listen(3000, () => console.log('server started on port 3000'));
