const Users = require('../models/user');
const { Router } = require('express');
const route = Router();
const bcrypt = require('bcrypt');
const { totp } = require('otplib');
const jwt = require('jsonwebtoken');
const { sendSms, sendEmail } = require('../functions/eskiz');
const { Op, where } = require('sequelize');
const { getToken } = require('../functions/eskiz');
const { refreshToken } = require('../functions/eskiz');
const { getRouteLogger } = require('../logger/logger');
const roleAuthMiddleware = require('../middlewares/roleAuth');

const userLogger = getRouteLogger(__filename);
const {
  userValidation,
  loginValidation,
  refreshTokenValidation,
  userValidationPatch,
} = require('../validations/user');
const roleAuthMiddlewares = require('../middlewares/roleAuth');
const Sessions = require('../models/sessions');
const Resource = require('../models/resource');
const { message } = require('../validations/learningCenter');
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User management APIs
 */

totp.options = { step: 120, digits: 4 };

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and sends OTP to email.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - phone
 *               - email
 *               - password
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: "+998901234567"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "johndoe@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecureP@ssw0rd"
 *               img:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: User successfully registered and OTP sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully. OTP sent to email."
 *       400:
 *         description: Validation error
 *       401:
 *         description: User with provided credentials already exists
 *       500:
 *         description: Internal server error
 */

route.post('/register', async (req, res) => {
  const { error } = userValidation.validate(req.body);
  if (error) {
    userLogger.log('warn', 'validatsiya error');
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    let { firstName, phone, email, lastName, password, ...rest } = req.body;
    let userExists = await Users.findOne({
      where: { firstName },
    });
    if (userExists) {
      userLogger.log('warn', 'first name  already exist');

      return res.status(401).send({ message: 'first name already exists' });
    }
    let lastNameExists = await Users.findOne({
      where: { lastName },
    });
    if (lastNameExists) {
      userLogger.log('warn', 'last name  already exist');

      return res.status(401).send({ message: 'last name already exists' });
    }

    let emailExists = await Users.findOne({
      where: { email },
    });
    if (emailExists) {
      userLogger.log('warn', 'email   already exist');
      return res.status(401).send({ message: 'Email already exists' });
    }

    let phoneExists = await Users.findOne({
      where: { phone },
    });
    if (phoneExists) {
      userLogger.log('warn', 'phone  already exist');

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
    let token = totp.generate(email + 'email');
    await sendEmail(email, token);
    res.send(newUser);
  } catch (error) {
    userLogger.log('error', 'server error');
    res.status(500).send({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /users/verify:
 *   post:
 *     summary: Email orqali OTP kodini tasdiqlash
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Tasdiqlash muvaffaqiyatli bo'ldi, foydalanuvchi `ACTIVE` holatiga o'tdi
 *       401:
 *         description: Noto'g'ri yoki eskirgan OTP
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */

route.post('/verify', async (req, res) => {
  let { email, otp } = req.body;
  try {
    let user = await Users.findOne({ where: { email } });
    if (!user) {
      userLogger.log('warn', 'user already exists');

      res.status(404).send({ message: 'user not exists' });
      return;
    }
    let match = totp.verify({ token: otp, secret: email + 'email' });
    if (!match) {
      userLogger.log('warn', 'otp not valid');
      res.status(401).send({ message: 'otp not valid' });

      return;
    }
    await user.update({ status: 'ACTIVE' });
    userLogger.log('info', 'post qilindi');
    res.send(match);
  } catch (error) {
    console.log(error);
  }
});

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
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
    userLogger.log('warn', 'validation error');
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    let { firstName, password } = req.body;
    let user = await Users.findOne({ where: { firstName } });

    if (!user) {
      userLogger.log('warn', 'user  not  found');
      return res.status(404).json({ message: 'User not found' });
    }

    let match = bcrypt.compareSync(password, user.password);
    if (!match) {
      userLogger.log('warn', 'password error');

      return res.status(401).json({ message: 'Invalid password' });
    }

    let lastIp = req.ip;
    let userSesion = await Sessions.findOne({ where: { userId: user.id } });
    let sesion = await Sessions.findOne({ where: { lastIp } });
    if (!userSesion || !sesion) {
      await Sessions.create({
        userId: user.id,
        lastIp: lastIp,
      });
    }

    await Users.update({ lastIp: lastIp }, { where: { id: user.id } });

    let accesToken = getToken(user.id, user.role);
    let refreToken = refreshToken(user);
    res.json({ accesToken, refreToken });
  } catch (error) {
    userLogger.log('error', 'Internal server error');

    console.log(error);

    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /users/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
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
    userLogger.log('error', 'Validation error');
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    let { refreshTok } = req.body;

    let user;
    try {
      user = jwt.verify(refreshTok, 'refresh');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Refresh token expired' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }
      return res.status(400).json({ message: 'Bad request' });
    }

    const newAccessToken = getToken(user.id);
    res.json({ newAccessToken });
  } catch (error) {
    userLogger.log('error', 'Internal server error');
    res.status(500).send({ message: 'Internal server error' });
    console.log(error);
  }
});

/**
 * @swagger
 * paths:
 *   /users/me/password:
 *     patch:
 *       summary: "Foydalanuvchi parolini yangilash"
 *       description: "Foydalanuvchi eski parolini tasdiqlab, yangi parol bilan almashtiradi."
 *       tags:
 *         - Profile
 *
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - oldPassword
 *                 - newPassword
 *               properties:
 *                 oldPassword:
 *                   type: string
 *                   example: "SecureP@ssw0rd"
 *                 newPassword:
 *                   type: string
 *                   example: "NewP@ssw0rd123"
 *       responses:
 *         200:
 *           description: "Parol muvaffaqiyatli yangilandi"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "Password updated"
 *         400:
 *           description: "Yuborilgan ma'lumot xato"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     example: "Eski parol noto'g'ri"
 *         404:
 *           description: "Foydalanuvchi topilmadi"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     example: "Foydalanuvchi topilmadi"
 *         500:
 *           description: "Server xatosi"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   error:
 *                     type: string
 *                     example: "Server xatosi"
 *                   details:
 *                     type: string
 *                     example: "Internal Server Error"
 */

route.patch(
  '/me/password',
  roleAuthMiddlewares(['ADMIN', 'USER']),
  async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res
          .status(400)
          .json({ error: 'Old va yangi parol talab qilinadi' });
      }

      const user = await Users.findByPk(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        userLogger.log('warn', 'password wrong error');
        return res.status(400).json({ error: "Eski parol noto'g'ri" });
      }

      const hash = await bcrypt.hash(newPassword, 10);
      await user.update({ password: hash });

      userLogger.log('info', 'user paroli yangilandi');
      res.json({ message: 'Password updated' });
    } catch (error) {
      userLogger.log('error', 'internal server error');
      res.status(500).json({ error: 'Server xatosi', details: error.message });
    }
  }
);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: "Foydalanuvchi profilini olish"
 *     description: "Joriy foydalanuvchining profil ma'lumotlarini olish"
 *     tags:
 *       - Profile
 *
 *     responses:
 *       200:
 *         description: "Foydalanuvchi profili muvaffaqiyatli qaytarildi"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: "Foydalanuvchi ID si"
 *                   example: 1
 *                 firstName:
 *                   type: string
 *                   description: "Foydalanuvchi ismi"
 *                   example: "Ali"
 *                 lastName:
 *                   type: string
 *                   description: "Foydalanuvchi familiyasi"
 *                   example: "Valiyev"
 *                 email:
 *                   type: string
 *                   description: "Foydalanuvchi email manzili"
 *                   example: "ali@example.com"
 *                 img:
 *                   type: string
 *                   description: "Foydalanuvchi profil rasmi URL manzili"
 *                   example: "https://example.com/profile.jpg"
 *                 lastIp:
 *                   type: string
 *                   description: "Foydalanuvchining oxirgi kirgan IP manzili"
 *                   example: "192.168.1.1"
 *       401:
 *         description: "Token yaroqsiz yoki mavjud emas"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: "Xato haqida ma'lumot"
 *                   example: "Token yaroqsiz yoki mavjud emas"
 *       404:
 *         description: "Foydalanuvchi topilmadi"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: "Foydalanuvchi topilmaganligi haqida xabar"
 *                   example: "user not found"
 *       500:
 *         description: "Server xatosi"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: "Server xatosi haqida ma'lumot"
 *                   example: "Server xatosi"
 *                 details:
 *                   type: string
 *                   description: "Xatolik tafsilotlari"
 *                   example: "Xatolik tafsilotlari"
 */

route.get('/me', roleAuthMiddlewares(['ADMIN', 'USER']), async (req, res) => {
  try {
    const userId = req.userId;
    console.log(userId);

    const user = await Users.findByPk(userId, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'img', 'lastIp'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    userLogger.log('info', 'internal server error');

    console.error('Xatolik:', error);
    res.status(500).json({ error: 'Server xatosi', details: error.message });
  }
});

/**
 * @swagger
 * /users/me-sesion:
 *   get:
 *     summary: Get current user session
 *     tags: [Profile]
 *
 *     responses:
 *       200:
 *         description: User session found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "You are logged in"
 *                 session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     lastIp:
 *                       type: string
 *       401:
 *         description: Unauthorized - User needs to log in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session not found, please log in"
 *       500:
 *         description: Internal Server Error
 */
route.get(
  '/me-sesion',
  roleAuthMiddleware(['ADMIN', 'USER']),
  async (req, res) => {
    try {
      const userId = req.userId;
      const lastIp = req.ip;

      const session = await Sessions.findOne({ where: { userId, lastIp } });

      if (session) {
        return res.status(200).json({ message: 'You are logged in', session });
      } else {
        return res
          .status(401)
          .json({ message: 'Session not found, please log in' });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Internal Server Error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: "Barcha foydalanuvchilar ro‘yxatini olish"
 *     description: "Bazadagi barcha foydalanuvchilarni qaytaradi."
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: "Foydalanuvchi ismi, familiyasi, email yoki telefon raqami bo‘yicha qidirish"
 *       - in: query
 *         name: firstName
 *         schema:
 *           type: string
 *         description: "Foydalanuvchi ismi bo‘yicha qidirish"
 *       - in: query
 *         name: lastName
 *         schema:
 *           type: string
 *         description: "Foydalanuvchi familiyasi bo‘yicha qidirish"
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: "Foydalanuvchi emaili bo‘yicha qidirish"
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: "Foydalanuvchi telefon raqami bo‘yicha qidirish"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: "id"
 *         description: "Qaysi ustun bo‘yicha tartiblash"
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: "ASC"
 *         description: "Tartiblash tartibi (ASC - o‘sish, DESC - kamayish)"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Qaysi sahifani olish"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: "Har bir sahifada nechta natija chiqarish"
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
 *                   firstName:
 *                     type: string
 *                     example: "John"
 *                   lastName:
 *                     type: string
 *                     example: "Doe"
 *                   email:
 *                     type: string
 *                     example: "johndoe@example.com"
 *                   phone:
 *                     type: string
 *                     example: "+998901234567"
 *       500:
 *         description: "Server xatosi"
 */

route.get('/', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    let {
      search,
      firstName,
      lastName,
      email,
      phone,
      sortBy = 'id',
      order = 'ASC',
      page = 1,
      limit = 10,
    } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    let whereCondition = {};
    if (search) {
      whereCondition[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ];
    } else {
      if (firstName) whereCondition.firstName = { [Op.like]: `%${firstName}%` };
      if (lastName) whereCondition.lastName = { [Op.like]: `%${lastName}%` };
      if (email) whereCondition.email = { [Op.like]: `%${email}%` };
      if (phone) whereCondition.phone = { [Op.like]: `%${phone}%` };
    }
    const users = await Users.findAndCountAll({
      where: whereCondition,
      order: [[sortBy, order.toUpperCase()]],
      limit,
      offset: (page - 1) * limit,
    });
    userLogger.log('info', 'get boldi');

    res.status(200).json({
      total: users.count,
      page,
      limit,
      data: users.rows,
    });
  } catch (error) {
    userLogger.log('error', 'Internal server error');

    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Foydalanuvchi ma'lumotlarini olish
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID si
 *     responses:
 *       200:
 *         description: Foydalanuvchi ma'lumotlari
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Ali Valiyev"
 *                 email:
 *                   type: string
 *                   example: "ali@example.com"
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */

route.get('/:id', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const one = await Users.findByPk(req.params.id);
    if (!one) return res.status(404).send({ message: 'user not found' });
    userLogger.log('info', 'id boyicha qilindi');
    res.send(one);
  } catch (error) {
    res.status(500).send({ error: 'server error' });
    userLogger.log('error', 'serverda xatolik');
  }
});

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Foydalanuvchi ma'lumotlarini yangilash
 *     tags: [User]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Ali"
 *               lastName:
 *                 type: string
 *                 example: "Valiyev"
 *               email:
 *                 type: string
 *                 example: "ali@example.com"
 *               password:
 *                   type: string
 *                   example: "123456"
 *               phone:
 *                 type: string
 *                 example: "+998901234567"
 *               img:
 *                   type: string
 *                   example: "http://localhost:3000/api-docs/#/User/patch_users__id_"
 *
 *     responses:
 *       200:
 *         description: Foydalanuvchi muvaffaqiyatli yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 name:
 *                   type: string
 *                   example: "Ali Valiyev"
 *                 email:
 *                   type: string
 *                   example: "ali@example.com"
 *
 *                 learningCenterId:
 *                   type: string
 *                   example: "ali@example.com"
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */

route.patch(
  '/:id',
  roleAuthMiddlewares(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    let { error } = userValidationPatch.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }
    try {
      const { id } = req.params;
      const one = await Users.findByPk(id);

      if (!one) {
        userLogger.log('warn', 'user not found');
        return res.status(404).send({ error: 'User not found' });
      }

      let { firstName, lastName, email, phone } = req.body;

      const existingUser = await Users.findOne({
        where: {
          [Op.or]: [
            firstName ? { firstName } : null,
            lastName ? { lastName } : null,
            email ? { email } : null,
            phone ? { phone } : null,
          ].filter(Boolean),
          id: { [Op.ne]: id },
        },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Some fields already exist' });
      }
      let userExists = await Users.findOne({ where: { firstName } });
      if (userExists) {
        return res.status(400).send({ message: 'first name already exists' });
      }

      await one.update(req.body);
      res.json(one);
    } catch (error) {
      userLogger.log('error', 'Internal server error');
      console.log(error);
      res.status(500).json({ error: 'Server xatosi', details: error.message });
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Foydalanuvchini o‘chirish
 *     tags: [User]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: O‘chiriladigan foydalanuvchi ID si
 *     responses:
 *       200:
 *         description: Foydalanuvchi muvaffaqiyatli o‘chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "user o'chirildi"
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
route.delete('/:id', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Users.destroy({ where: { id } });
    if (deleted) {
      userLogger.log('warn', 'delete bold');
      return res.send({ message: "user o'chirildi", deleted });
    }
    res.status(404).send({ error: 'user topilmadi' });
  } catch (error) {
    userLogger.log('error', 'internal server error');

    res.status(500).send({ error: 'Server xatosi', details: error.message });
  }
});

/**
 * @swagger
 * /users/resources/user/{id}:
 *   get:
 *     summary: Get all resources belonging to a specific user
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of resources belonging to the user
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

route.get('/resources/user/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await Users.findOne({
      where: { id: userId },
      include: [{ model: Resource }],
    });

    if (!user) {
      userLogger.log('warn', 'user not found');
      return res.status(404).json({ message: 'user not found' });
    }
    userLogger.log('info', 'get ishladi');
    res.status(200).json({
      message: 'User and their resources',
      data: {
        user: {
          id: user.id,
          name: user.firstName,
          email: user.lastName,
        },
        resources: user.Resources,
      },
    });
  } catch (error) {
    userLogger.log('error', 'internal server error');
    res
      .status(500)
      .json({ message: 'internal server error', error: error.message });
  }
});

module.exports = route;
