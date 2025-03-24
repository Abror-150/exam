const express = require("express");
const { connectedDb } = require("./config/db");
const LikeRoutes = require("./routes/likes");
const ProfessionRoutes = require("./routes/professions");
const { swaggerUi, swaggerDocs } = require("./swagger");

const app = express();
connectedDb();
app.use(express.json());
app.use("/likes", LikeRoutes);
app.use("/professions", ProfessionRoutes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.listen(3000, () => console.log("server started on port 3000"));
