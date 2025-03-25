const jwt = require("jsonwebtoken");

function roleAuthMiddleware(roles) {
  return (req, res, next) => {
    try {
      const token = req.header("Authorization")?.split(" ")[1];
      if (!token) {
        return res.status(401).send({ message: "Token not provided" });
      }
      const data = jwt.verify(token, "getToken");
      req.user = data; 
      req.userId = data.id; 
      req.userRole = data.role;

      if (!roles.includes(req.userRole)) {
        return res.status(403).send({ message: "Not allowed" });
      }

      next(); 
    } catch (error) {
      console.log("JWT verification error:", error);
      return res.status(401).send({ message: "Invalid token" });
    }
  };
}

module.exports = roleAuthMiddleware;
