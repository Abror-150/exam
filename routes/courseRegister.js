const express = require('express');
const CourseRegister = require('../models/courseRegister');
const Users = require('../models/user');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const LearningCenter = require('../models/learningCenter');
const CourseRegistervalidation = require('../validations/courseRegister');
const route = express.Router();
const logger = require('../logger/logger');

/**
 * @swagger
 * /course-register:
 *   post:
 *     summary: Foydalanuvchini kursga ro'yxatdan o'tkazish
 *     tags: [Course Register]

 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - learningCenterId
 *             properties:
 *               learningCenterId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Ro'yxatdan o'tish muvaffaqiyatli yaratildi
 *       404:
 *         description: User yoki Learning Center topilmadi
 *       500:
 *         description: Server xatosi
 */
route.post('/', roleAuthMiddleware(['USER', 'ADMIN']), async (req, res) => {
  logger.info('POST /course-register', { body: req.body });
  let { error } = CourseRegistervalidation.validate(req.body);
  if (error) {
    logger.warn('Validation error', { error: error.details[0].message });
    return res.status(400).send({ error: error.details[0].message });
  }
  try {
    const { learningCenterId } = req.body;
    const userId = req.userId;

    const user = await Users.findByPk(userId);
    const learningCenter = await LearningCenter.findByPk(learningCenterId);

    if (!user) {
      logger.warn('User not found', { userId });
      return res.status(404).json({ message: 'User  not found' });
    }
    if (!learningCenter) {
      logger.warn('Learning center not found', { learningCenterId });
      return res.status(404).json({ message: 'edu center  not found' });
    }

    const existingRegistration = await CourseRegister.findOne({
      where: { userId, learningCenterId },
    });

    if (existingRegistration) {
      logger.warn('User already registered', { userId, learningCenterId });
      return res.status(400).json({
        message: 'User is already registered in this learning center',
      });
    }

    const registration = await CourseRegister.create({
      userId,
      learningCenterId,
    });
    logger.info('User registered successfully', { userId, learningCenterId });
    res.status(201).json(registration);
  } catch (error) {
    logger.error('Server error', { error: error.message });
    console.error('Xatolik:', error);
    res.status(500).json({ message: 'Server xatosi', error: error.message });
  }
});

/**
 * @swagger
 * /course-register:
 *   get:
 *     summary: Barcha ro'yxatdan o'tganlarni olish
 *     tags: [Course Register]
 *     responses:
 *       200:
 *         description: Ro'yxatdan o'tganlar ro'yxati
 *       500:
 *         description: Server xatosi
 */
route.get('/', async (req, res) => {
  try {
    const registrations = await CourseRegister.findAll({ include: [{ model: Users }] });
    logger.info('GET /course-register', { count: registrations.length });
    res.status(200).json(registrations);
  } catch (error) {
    logger.error('Server error', { error: error.message });
    res.status(500).json({ message: 'Server xatosi' });
  }
});

/**
 * @swagger
 * /course-register/{id}:
 *   patch:
 *     summary: Ro'yxatdan o'tishni yangilash
 *     tags: [Course Register]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               learningCenterId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ro'yxatdan o'tish muvaffaqiyatli yangilandi
 *       404:
 *         description: Register topilmadi
 *       500:
 *         description: Server xatosi
 */
route.patch(
  '/:id',
  roleAuthMiddleware(['USER', 'ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.userId;
      const { learningCenterId } = req.body;

      const registration = await CourseRegister.findByPk(id);
      if (!registration) {
        logger.warn('Registration not found', { id });
        return res.status(404).json({ message: 'Register not found' });
      }

      await registration.update({ userId, learningCenterId });
      logger.info('Registration updated', { id, userId, learningCenterId });
      res.status(200).json(registration);
    } catch (error) {
      logger.error('Server error', { error: error.message });
      console.error(error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  }
);

/**
 * @swagger
 * /course-register/{id}:
 *   delete:
 *     summary: Ro'yxatdan o'tishni o'chirish
 *     tags: [Course Register]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ro'yxatdan o'tish o'chirildi
 *       404:
 *         description: Register topilmadi
 *       500:
 *         description: Server xatosi
 */
route.delete(
  '/:id',
  roleAuthMiddleware(['USER', 'ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const registration = await CourseRegister.findByPk(id);

      if (!registration) {
        logger.warn('Registration not found', { id });
        return res.status(404).json({ message: 'Register not found' });
      }

      await registration.destroy();
      logger.info('Registration deleted', { id });
      res.status(200).json({ message: "Ro'yxatdan o'tish o'chirildi" });
    } catch (error) {
      logger.error('Server error', { error: error.message });
      console.error(error);
      res.status(500).json({ message: 'Server xatosi' });
    }
  }
);

module.exports = route;