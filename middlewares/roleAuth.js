const jwt = require('jsonwebtoken');

function roleAuthmiddleware(roles) {
  return (req, res, next) => {
    try {
      const token = req.header('Authorization');
      console.log(req.header('Authorization'));

      console.log(token);
      if (!token) {
        return res.status(401).send({ message: 'Token not provided' });
      }

      const data = jwt.verify(token, 'getToken');

      if (roles.includes(data?.role)) {
        req.userId = data?.id;
        req.userRole = data?.role;
        next();
      } else {
        return res.status(402).send({ message: 'not allowed' });
      }
    } catch (error) {
      console.log('JWT verification error:', error);
      return res.status(401).send({ message: 'Invalid token' });
    }
  };
}

module.exports = roleAuthmiddleware;
