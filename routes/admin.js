const { Router } = require('express');
const route = Router();
const bcrypt = require('bcrypt');
const { totp } = require('otplib');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { getToken } = require('../functions/eskiz');
const { refreshToken } = require('../functions/eskiz');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const Users = require('../models/user');
const { userValidation } = require('../validations/user');
const { sendEmail } = require('../functions/eskiz');
const { getRouteLogger } = require('../logger/logger');
const adminLogger = getRouteLogger(__filename);
/**
 * @swagger
 * /add-admin:
 *   post:
 *     summary: Create a new admin user
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *               phone:
 *                 type: string
 *                 example: "+998901234567"
 *               img:
 *                 type: string
 *                 example: "http://random"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "StrongPass123!"
 *               role:
 *                 type: string
 *                 example: "ADMIN"
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "PENDING"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (Token required)
 *       403:
 *         description: Forbidden (Only Admins can create users)
 *       500:
 *         description: Internal server error
 */

route.post('/', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  const { error } = userValidation.validate(req.body);
  if (error) {
    adminLogger.log('warn', 'Validation error');
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      adminLogger.log('warn', 'Admin create error');
      return res
        .status(403)
        .send({ message: 'Access denied: Only admins can create users' });
    }

    let { firstName, phone, email, lastName, password, role, ...rest } =
      req.body;

    if (role && role !== 'ADMIN') {
      return res
        .status(400)
        .send({ message: 'Only ADMIN users can be created' });
    }

    let existingUser = await Users.findOne({
      where: {
        [Op.or]: [{ firstName }, { lastName }, { email }, { phone }],
      },
    });

    if (existingUser) {
      adminLogger.log('warn', 'Duplicate user data');
      return res
        .status(401)
        .send({ message: 'User with provided data already exists' });
    }

    let hash = bcrypt.hashSync(password, 10);
    let newAdmin = await Users.create({
      ...rest,
      firstName,
      email,
      lastName,
      phone,
      password: hash,
      role,
      status: 'PENDING',
    });

    let token = totp.generate(email + 'email');
    await sendEmail(email, token);

    res.status(201).send(newAdmin);
  } catch (error) {
    adminLogger.log('error', 'Internal server error');
    res.status(500).send({ message: 'Internal server error' });
    console.log(error);
  }
});

module.exports = route;
