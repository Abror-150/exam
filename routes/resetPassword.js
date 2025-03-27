// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Users = require('../models/user');
const { Sequelize, Op } = require('sequelize');
const { sendEmail } = require('../functions/eskiz');
const NodeCache = require('node-cache');
const { message } = require('../validations/professions');
const myCache = new NodeCache({ stdTTL: 3600 });
const route = express.Router();

/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Parolni tiklash linkini yuborish
 *     description: Foydalanuvchi elektron pochta manzili bo'yicha parolni tiklash linkini yuboradi.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Parolni tiklash linki yuborildi
 *       400:
 *         description: Email manzili ko'rsatilmagan!
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Serverda xato yuz berdi
 */

route.post('/reset-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Users.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'user not found' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    myCache.set(resetToken, email, 3600);

    const reseToken = `${resetToken}`;
    await sendEmail(email, reseToken);

    return res.json({ resetLink });
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ message: 'Serverda xato yuz berdi' });
  }
});

/**
 * @swagger
 * /update-password:
 *   post:
 *     summary: Parolni yangilash
 *     description: Reset token yordamida foydalanuvchining parolini yangilash.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "user@example.com"
 *               newPassword:
 *                 type: string
 *                 example: "newPassword123"
 *     responses:
 *       200:
 *         description: Parol muvaffaqiyatli yangilandi
 *       400:
 *         description: Noto'g'ri yoki muddati o'tgan token
 *       500:
 *         description: Serverda xato yuz berdi
 */

route.post('/update-password', async (req, res) => {
  const { newPassword } = req.body;

  try {
    const user = await Users.findOne({ where: { email: req.body.email } });

    if (!user) {
      return res.status(404).json({ message: 'email not found' });
    }
    if (!newPassword) {
      return res.status(401).send({ message: 'password kiriting' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.json({ message: 'Parol muvaffaqiyatli yangilandi!' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Serverda xato yuz berdi' });
  }
});

module.exports = route;
