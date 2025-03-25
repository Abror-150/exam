const express = require('express');
const route = express.Router();
const Comments = require('../models/comment');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const Users = require('../models/user');
const LearningCenter = require('../models/learningCenter');
const { message } = require('../validations/regions');

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *
 *         - learningCenterId
 *         - star
 *         - message
 *       properties:
 *         id:
 *           type: integer
 *           description: Foydalanuvchi ID-si
 *
 *         learningCenterId:
 *           type: integer
 *           description: Izoh qoldirilgan markaz ID
 *         star:
 *           type: integer
 *           description: Reyting (1-5)
 *         message:
 *           type: string
 *           description: Izoh matni
 *       example:
 *
 *
 *         learningCenterId: 3
 *         star: 5
 *         message: "Juda zo'r markaz!"
 */

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Barcha izohlarni olish
 *     tags: [Comment]
 *     responses:
 *       200:
 *         description: Izohlar ro'yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
route.get('/', async (req, res) => {
  try {
    const comments = await Comments.findAll({
      include: [{ model: Users }, { model: LearningCenter }],
    });
    if (!comments.length) return res.send('Comment not found');

    res.send(comments);
  } catch (error) {
    res.status(500).send({message:`Xatolik yuz berdi: ${error.message}`});
  }
});

/**
 * @swagger
 * /comments/{id}:
 *   get:
 *     summary: Bitta izohni olish
 *     tags: [Comment]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Izoh ID-si
 *     responses:
 *       200:
 *         description: Bitta izoh
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 */
route.get('/:id', async (req, res) => {
  try {
    const comment = await Comments.findByPk(req.params.id, {
      include: [{ model: LearningCenter }, { model: Users }],
    });
    if (!comment) return res.status(404).send({ message: 'comment not found' });

    res.send(comment);
  } catch (error) {
    res.status(500).send({ error: 'server error' });
  }
});

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Yangi izoh qo'shish
 *     tags: [Comment]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: Yangi izoh qo'shildi
 */
route.post('/', roleAuthMiddleware(['ADMIN', 'USER']), async (req, res) => {
  try {
    const { learningCenterId, star, message } = req.body;

    const userId = req.userId;

    const newComment = await Comments.create({
      userId,
      learningCenterId,
      star,
      message,
    });
    res.send(newComment);
    console.log(newComment);
  } catch (error) {
    res.status(500).send({ error: 'server error' });
  }
});

/**
 * @swagger
 * /comments/{id}:
 *   patch:
 *     summary: Izohni yangilash
 *     tags: [Comment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Izoh ID-si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               learningCenterId:
 *                 type: integer
 *               message:
 *                 type: string
 *               star:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Izoh yangilandi
 */
route.patch(
  '/:id',
  roleAuthMiddleware(['ADMIN', 'USER', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { learningCenterId, message, star } = req.body;
      const comment = await Comments.findByPk(req.params.id);
      if (!comment) return res.status(404).send('Comment not found');

      await comment.update({ learningCenterId, message, star });
      res.send(comment);
    } catch (error) {
      res.status(500).send(`Xatolik yuz berdi: ${error.message}`);
    }
  }
);

/**
 * @swagger
 * /comments/{id}:
 *   delete:
 *     summary: Izohni o'chirish
 *     tags: [Comment]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Izoh ID-si
 *     responses:
 *       200:
 *         description: Izoh o'chirildi
 */
route.delete(
  '/:id',
  roleAuthMiddleware(['ADMIN', 'USER']),
  async (req, res) => {
    try {
      const comment = await Comments.findByPk(req.params.id);
      if (!comment) return res.status(404).send('Comment not found');

      await comment.destroy();
      res.send(comment);
    } catch (error) {
      res.status(500).send(`Xatolik yuz berdi: ${error.message}`);
    }
  }
);

module.exports = route;
