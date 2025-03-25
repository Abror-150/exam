const Users = require('../models/user');
const { Router } = require('express');
const route = Router();
const bcrypt = require('bcrypt');
const { totp } = require('otplib');
const jwt = require('jsonwebtoken');
const { sendSms } = require('../functions/eskiz');
const { Op } = require('sequelize');
const { getToken } = require('../functions/eskiz');
const { refreshToken } = require('../functions/eskiz');
const {
  userValidation,
  loginValidation,
  otpValidation,
  sendOtpValidation,
  refreshTokenValidation,
} = require('../validations/user');
/**
 * @swagger
 * tags:
 *   name: Authorization
 *   description: User management APIs
 */

/**
 * @swagger
 * /users/send-otp:
 *   post:
 *     summary: Send OTP to phone number
 *     tags: [Authorization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       401:
 *         description: User already exists
 */

route.post('/send-otp', async (req, res) => {
  const { error } = sendOtpValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    let { phone } = req.body;

    let otp = totp.generate(phone + 'lorem');
    await sendSms(phone, otp);
    res.send(otp);
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /users/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Authorization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       402:
 *         description: Invalid OTP or phone number
 */

route.post('/verify-otp', async (req, res) => {
  const { error } = otpValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    let { otp, phone } = req.body;
    console.log(phone);

    let user = await Users.findOne({ where: { phone } });
    console.log(user);
    console.log(otp);

    if (!user) {
      return res.status(401).json({ message: 'Phone not found' });
    }

    if (user.otp != otp) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }
    let match = totp.verify({ token: otp, secret: phone + 'lorem' });

    res.send(match);
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
    console.log(error);
  }
});
totp.options = { step: 3000, digits: 4 };
/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authorization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *               email:
 *                 type: string
 *                 description: User's email address
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *               password:
 *                 type: string
 *                 description: User's password
 *               img:
 *                 type: string
 *                 description: Profile image URL
 *               role:
 *                 type: string
 *                 enum: [user, admin,]
 *                 default: user
 *                 description: User role
 *
 *     responses:
 *       200:
 *         description: User registered successfully
 *       401:
 *         description: Username, email, or phone already exists
 */

route.post('/register', async (req, res) => {
  const { error } = userValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    let { firstName, phone, email, lastName, password, ...rest } = req.body;
    let userExists = await Users.findOne({
      where: { firstName },
    });
    if (userExists) {
      return res.status(401).send({ message: 'first name already exists' });
    }
    let lastNameExists = await Users.findOne({
      where: { lastName },
    });
    if (lastNameExists) {
      return res.status(401).send({ message: 'last name already exists' });
    }

    let emailExists = await Users.findOne({
      where: { email },
    });
    if (emailExists) {
      return res.status(401).send({ message: 'Email already exists' });
    }

    let phoneExists = await Users.findOne({
      where: { phone },
    });
    if (phoneExists) {
      return res.status(401).send({ message: 'Phone already exists' });
    }
    let hash = bcrypt.hashSync(password, 10);
    let newUser = await Users.create({
      ...rest,
      firstName,
      email,
      lastName,
      phone,
      password: hash,
      status: 'PENDING',
    });

    res.send(newUser);
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
    console.log(error);
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     tags: [Authorization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Wrong password
 *       404:
 *         description: User not found
 */

route.post('/login', async (req, res) => {
  const { error } = loginValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    let { firstName, password } = req.body;
    let user = await Users.findOne({ where: { firstName } });
    console.log(user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    let userIp = req.ip;

    await Users.update({ lastIp: userIp }, { where: { id: user.id } });

    let accesToken = getToken(user.id, user.role);
    let refreToken = refreshToken(user);

    res.json({ accesToken, refreToken });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /users/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authorization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshTok:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token generated
 */

route.post('/refresh', async (req, res) => {
  let { error } = refreshTokenValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    let { refreshTok } = req.body;
    const user = jwt.verify(refreshTok, 'refresh');
    const newAccestoken = getToken(user.id);
    res.send({ newAccestoken });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
    console.log(error);
  }
});

/**
 * @swagger
 * /users:
 *   get:
 *     summary: "Barcha foydalanuvchilar ro‘yxatini olish"
 *     description: "Bazadagi barcha foydalanuvchilarni qaytaradi."
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: "Foydalanuvchilar ro‘yxati"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   username:
 *                     type: string
 *                     example: "johndoe"
 *                   email:
 *                     type: string
 *                     example: "johndoe@example.com"
 *       500:
 *         description: "Server xatosi"
 */

route.get('/', async (req, res) => {
  try {
    let data = await Users.findAll();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = route;
