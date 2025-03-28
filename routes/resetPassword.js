// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const Users = require('../models/user');
const { Sequelize, Op } = require('sequelize');
const { sendEmail, getToken } = require('../functions/eskiz');
const NodeCache = require('node-cache');
const { message } = require('../validations/professions');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const myCache = new NodeCache({ stdTTL: 3600 });
const route = express.Router();
const { getRouteLogger } = require('../logger/logger');

const resentPasswordLogger = getRouteLogger(__filename);
/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Parolni tiklash linkini yuborish
 *     tags:
 *       - Reset-Password
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

route.post(
  '/reset-password',
  roleAuthMiddleware(['ADMIN', 'USER']),
  async (req, res) => {
    const { email } = req.body;

    try {
      const user = await Users.findOne({ where: { email } });
      if (!user) {
        resentPasswordLogger.log('warn', 'user not found');
        return res.status(404).json({ message: 'user not found' });
      }

      const resetToken = getToken(user.id, user.role);
      myCache.set(resetToken, email, 3600);

      const reseToken = `${resetToken}`;
      await sendEmail(email, reseToken);
      resentPasswordLogger.log('info', 'post qilindi');

      return res.json({ reseToken });
    } catch (error) {
      resentPasswordLogger.log('error', 'internal server error');

      console.error('Error resetting password:', error);
      return res.status(500).json({ message: 'Serverda xato yuz berdi' });
    }
  }
);

/**
 * @swagger
 * /update-password:
 *   post:
 *     summary: Parolni yangilash
 *     tags:
 *       - Reset-Password
 *     description: Reset token yordamida foydalanuvchining parolini yangilash.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resetToken:
 *                 type: string
 *                 description: Foydalanuvchiga yuborilgan reset token
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               newPassword:
 *                 type: string
 *                 description: Yangi parol
 *                 example: "newSecurePassword123"
 *     responses:
 *       200:
 *         description: Parol muvaffaqiyatli yangilandi
 *       400:
 *         description: Noto'g'ri yoki muddati o'tgan token
 *       404:
 *         description: Foydalanuvchi topilmadi
 *       500:
 *         description: Serverda xato yuz berdi
 */

route.post('/update-password', async (req, res) => {
  const { resetToken, newPassword } = req.body;
  resentPasswordLogger.log('info', 'password updated');
  try {
    const email = myCache.get(resetToken);
    if (!email) {
      resentPasswordLogger.log('warn', 'email not found');

      return res
        .status(400)
        .json({ message: "Token noto'g'ri yoki muddati tugagan" });
    }

    const user = await Users.findOne({ where: { email } });
    if (!user) {
      resentPasswordLogger.log('warn', 'user not found');

      return res.status(404).json({ message: 'user not found' });
    }

    if (!newPassword) {
      resentPasswordLogger.log('warn', 'password not found');

      return res.status(400).json({ message: 'Yangi parol kiriting' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    myCache.del(resetToken);

    return res.json({ message: 'Parol updated' });
  } catch (error) {
    resentPasswordLogger.log('error', 'internal server error');
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Serverda xato yuz berdi' });
  }
});

module.exports = route;
