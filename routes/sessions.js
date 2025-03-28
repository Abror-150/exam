const { Router } = require('express');
const { Op } = require('sequelize');
const route = Router();
const roleAuthMiddleware = require('../middlewares/roleAuth');
const sessionsSchema = require('../validations/sessions');
const Sessions = require('../models/sessions');
const Users = require('../models/user');

/**
 * @swagger
 * tags:
 *   name: Sessions
 *   description: Session CRUD operatsiyalari
 */

/**
 * @swagger
 * /sessions:
 *   get:
 *     summary: Barcha sessiyalarni olish
 *     tags: [Sessions]
 *     responses:
 *       200:
 *         description: Sessiyalar ro‘yxati
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
 *                   device:
 *                     type: string
 *                     example: "iPhone 13"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-03-27T10:00:00Z"
 *       400:
 *         description: Xatolik yuz berdi
 */

route.get('/', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    let data = await Sessions.findAll({ include: [{ model: Users }] });
    res.send(data);
  } catch (error) {
    res.status(400).send({ message: error.message });
    console.log(error);
  }
});

/**
 * @swagger
 * /sessions/{id}:
 *   get:
 *     summary: Get a session by ID
 *     tags: [Sessions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Session ID
 *     responses:
 *       200:
 *         description: Successfully retrieved session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 data:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *       404:
 *         description: Session not found
 *       400:
 *         description: Bad request
 */
route.get('/:id', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    let data = await Sessions.findByPk(req.params.id, {
      include: [{ model: Users }],
    });
    if (!data) {
      return res.status(404).send({ message: 'Session not found' });
    }
    res.send(data);
  } catch (error) {
    res.status(400).send({ message: error.message });
    console.log(error);
  }
});

/**
 * @swagger
 * /sessions/{id}:
 *   delete:
 *     summary: "Sessionni o‘chirish"
 *     description: "Sessionni ID orqali o‘chiradi. Faqat ADMIN ruxsatga ega."
 *     tags: [Sessions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: "Session ID si"
 *         schema:
 *           type: integer
 *     responses:
 *       "200":
 *         description: "Session muvaffaqiyatli o‘chirildi"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Session ochirildi"
 *       "404":
 *         description: "Session topilmadi"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Session topilmadi"
 *       "500":
 *         description: "Server xatosi"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Server xatosi"
 */
route.delete('/:id', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const session = await Sessions.findByPk(req.params.id);
    if (!session) {
      return res.status(404).json({ message: 'Session topilmadi' });
    }
    await session.destroy();
    res.json({ message: 'Session ochirildi', session });
  } catch (error) {
    res.status(500).send({ error: 'Server xatosi', details: error.message });
    console.log(error);
  }
});

module.exports = route;
