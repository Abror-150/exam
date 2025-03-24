const express = require("express");
const { connectedDb } = require("./config/db");
app = express();
app.use(express.json());
connectedDb();
app.listen(3000, () => {
  console.log("server started");
});
