const express = require('express');
const { connectedDb } = require('./config/db');

const app = express();
connectedDb();
app.use(express.json());

app.listen(3000, () => console.log('server started on port 3000'));
