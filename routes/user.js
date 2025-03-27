const Users = require("../models/user");
const { Router } = require("express");
const route = Router();
const bcrypt = require("bcrypt");
const { totp } = require("otplib");
const jwt = require("jsonwebtoken");
const { sendSms, sendEmail } = require("../functions/eskiz");
const { Op } = require("sequelize");
const { getToken } = require("../functions/eskiz");
const { refreshToken } = require("../functions/eskiz");
const { getRouteLogger } = require("../logger/logger");
const roleAuthMiddleware = require("../middlewares/roleAuth");

const userLogger = getRouteLogger(__filename);
const {
  userValidation,
  loginValidation,
  refreshTokenValidation,
} = require("../validations/user");
const roleAuthMiddlewares = require("../middlewares/roleAuth");
const Sessions = require("../models/sessions");
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs
 */

totp.options = { step: 120, digits: 4 };

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account and sends OTP to email.
 *     tags: [Users]
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

route.post("/register", async (req, res) => {
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
      return res.status(401).send({ message: "first name already exists" });
    }
    let lastNameExists = await Users.findOne({
      where: { lastName },
    });
    if (lastNameExists) {
      return res.status(401).send({ message: "last name already exists" });
    }

    let emailExists = await Users.findOne({
      where: { email },
    });
    if (emailExists) {
      return res.status(401).send({ message: "Email already exists" });
    }

    let phoneExists = await Users.findOne({
      where: { phone },
    });
    if (phoneExists) {
      return res.status(401).send({ message: "Phone already exists" });
    }
    let hash = bcrypt.hashSync(password, 10);
    let newUser = await Users.create({
      ...rest,
      firstName,
      email,
      lastName,
      phone,
      password: hash,
      status: "PENDING",
    });
    let token = totp.generate(email + "email");
    await sendEmail(email, token);
    res.send(newUser);
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
    console.log(error);
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Foydalanuvchi ma'lumotlarini olish
 *     tags: [Users]
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

route.get("/:id", roleAuthMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const one = await Users.findByPk(req.params.id);
    if (!one) return res.status(404).send({ message: "user not found" });
    res.send(one);
  } catch (error) {
    res.status(500).send({ error: "server error" });
  }
});
/**
 * @swagger
 * /users/verify:
 *   post:
 *     summary: Email orqali OTP kodini tasdiqlash
 *     tags:
 *       - Users
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

route.post("/verify", async (req, res) => {
  let { email, otp } = req.body;
  try {
    let user = await Users.findOne({ where: { email } });
    if (!user) {
      res.status(404).send({ message: "user not exists" });
      return;
    }
    let match = totp.verify({ token: otp, secret: email + "email" });
    if (!match) {
      res.status(401).send({ message: "otp not valid" });
      return;
    }
    await user.update({ status: "ACTIVE" });
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
 *     tags: [Users]
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

route.post("/login", async (req, res) => {
  const { error } = loginValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    let { firstName, password } = req.body;
    let user = await Users.findOne({ where: { firstName } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid password" });
    }
    
    let userIp = req.ip;
    let userSesion = await Sessions.findOne({ where: { userId: user.id } });
    let sesion = await Sessions.findOne({ where: { userIp } });
    if (!userSesion || !sesion) {
      await Sessions.create({ userId: user.id, userIp });
    }
    
    await Users.update({ lastIp: userIp }, { where: { id: user.id } });

    let accesToken = getToken(user.id, user.role);
    let refreToken = refreshToken(user);
    res.json({ accesToken, refreToken });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * @swagger
 * /users/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Users]
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

route.post("/refresh", async (req, res) => {
  let { error } = refreshTokenValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    let { refreshTok } = req.body;
    const user = jwt.verify(refreshTok, "refresh");
    const newAccestoken = getToken(user.id);
    res.send({ newAccestoken });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
    console.log(error);
  }
});

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     summary: "Foydalanuvchi parolini o'zgartirish"
 *     description: "Foydalanuvchi eski parolini tekshirib, yangi parol bilan almashtiradi."
 *     tags:
 *       - Profile
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: "old_password123"
 *               newPassword:
 *                 type: string
 *                 example: "new_secure_password123"
 *     responses:
 *       200:
 *         description: "Parol muvaffaqiyatli o'zgartirildi"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Parol muvaffaqiyatli o'zgartirildi"
 *       400:
 *         description: "Eski parol noto'g'ri"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Eski parol noto'g'ri"
 *       500:
 *         description: "Server xatosi"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server xatosi"
 *                 details:
 *                   type: string
 *                   example: "Error details..."
 */

route.patch(
  "/me/password",
  roleAuthMiddlewares(["ADMIN", "USER"]),
  async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await Users.findByPk(req.userId);

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch)
        return res.status(400).json({ error: "Eski parol noto'g'ri" });

      const hash = await bcrypt.hash(newPassword, 10);
      await Users.update({ password: hash }, { where: { id: user.id } });

      res.json({ message: "Parol muvaffaqiyatli o'zgartirildi" });
    } catch (error) {
      res.status(500).json({ error: "Server xatosi", details: error.message });
    }
  }
);
/**
 * @swagger
 * /users:
 *   get:
 *     summary: "Barcha foydalanuvchilar ro‘yxatini olish"
 *     description: "Bazadagi barcha foydalanuvchilarni qaytaradi."
 *     tags: [Users]
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

route.get("/", roleAuthMiddleware(["ADMIN"]), async (req, res) => {
  try {
    let {
      search,
      firstName,
      lastName,
      email,
      phone,
      sortBy = "id",
      order = "ASC",
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

    res.status(200).json({
      total: users.count,
      page,
      limit,
      data: users.rows,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

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

route.get("/me", roleAuthMiddlewares(["USER", "ADMIN"]), async (req, res) => {
  try {
    const userId = req.userId;

    const user = await Users.findByPk(userId, {
      attributes: ["id", "firstName", "lastName", "email", "img", "lastIp"],
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Xatolik:", error);
    res.status(500).json({ error: "Server xatosi", details: error.message });
  }
});

/**
 * @swagger
 * /users/me/password:
 *   patch:
 *     summary: Foydalanuvchi ma'lumotlarini yangilash
 *     tags: [Users]
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
 *               phone:
 *                 type: string
 *                 example: "+998901234567"
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
 *                 learningCenterId:
 *                   type: string
 *                   example: "ali@example.com"
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Server xatosi
 */
route.patch(
  "/:id",
  roleAuthMiddlewares(["ADMIN", "SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const one = await Users.findByPk(id);
      if (!one) {
        return res.status(404).send({ error: "user not found" });
      }
      await one.update(req.body);
      res.json(one);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi", details: error.message });
    }
  }
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Foydalanuvchini o‘chirish
 *     tags: [Users]
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
route.delete("/:id", roleAuthMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Users.destroy({ where: { id } });
    if (deleted) {
      return res.send({ message: "user o'chirildi", deleted });
    }
    res.status(404).send({ error: "user topilmadi" });
  } catch (error) {
    res.status(500).send({ error: "Server xatosi", details: error.message });
  }
});

module.exports = route;
