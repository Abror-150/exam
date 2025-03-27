const { Router } = require("express");
const route = Router();
const bcrypt = require("bcrypt");
const { totp } = require("otplib");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { getToken } = require("../functions/eskiz");
const { refreshToken } = require("../functions/eskiz");
const roleAuthMiddleware = require("../middlewares/roleAuth");
const Users = require("../models/user");
const { userValidation } = require("../validations/user");
const { sendEmail } = require("../functions/eskiz");

/**
 * @swagger
 * /add-admin:
 *   post:
 *     summary: Create a new admin user
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []  # ⬅️ Swaggerga token qo'shish
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
route.post("/", roleAuthMiddleware(["ADMIN"]), async (req, res) => {
  const { error } = userValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    console.log("Decoded User:", req.user);

    if (!req.user || req.user.role !== "ADMIN") {
      return res
        .status(403)
        .send({ message: "Access denied: Only admins can create users" });
    }

    let { firstName, phone, email, lastName, password, ...rest } = req.body;

    let adminExists = await Users.findOne({ where: { firstName } });
    if (adminExists)
      return res.status(401).send({ message: "first name already exists" });

    let lastNameExists = await Users.findOne({ where: { lastName } });
    if (lastNameExists)
      return res.status(401).send({ message: "last name already exists" });

    let emailExists = await Users.findOne({ where: { email } });
    if (emailExists)
      return res.status(401).send({ message: "Email already exists" });

    let phoneExists = await Users.findOne({ where: { phone } });
    if (phoneExists)
      return res.status(401).send({ message: "Phone already exists" });

    let hash = bcrypt.hashSync(password, 10);
    let newAdmin = await Users.create({
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

    res.status(201).send(newAdmin);
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
    console.log(error);
  }
});

module.exports = route;
