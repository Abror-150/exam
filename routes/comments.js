const express = require('express');
const route = express.Router();
const Comments = require('../models/comment');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const Users = require('../models/user');
const LearningCenter = require('../models/learningCenter');
const { message } = require('../validations/regions');
const { Op } = require('sequelize');

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
 *     summary: Barcha izohlarni olish (Filtr, Sort, Pagination bilan)
 *     tags: [Comment]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Foydalanuvchi ID bo‘yicha filtr
 *       - in: query
 *         name: learningCenterId
 *         schema:
 *           type: integer
 *         description: O‘quv markazi ID bo‘yicha filtr
 *       - in: query
 *         name: star
 *         schema:
 *           type: integer
 *         description: Star bo‘yicha filtr (aniq qiymat yoki kamida shu stardan katta bo'lganlar)
 *       - in: query
 *         name: minStar
 *         schema:
 *           type: integer
 *         description: Eng kam star (shu stardan yuqori bo‘lgan izohlar)
 *       - in: query
 *         name: maxStar
 *         schema:
 *           type: integer
 *         description: Eng yuqori star (shu stardan past bo‘lgan izohlar)
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [createdAt, star]
 *         description: Saralash (createdAt, star)
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Saralash tartibi (ASC yoki DESC)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Sahifalash (Nechinchi sahifa)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Sahifalash (Bir sahifada nechta)
 *     responses:
 *       200:
 *         description: Izohlar ro‘yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       userId:
 *                         type: integer
 *                         example: 5
 *                       learningCenterId:
 *                         type: integer
 *                         example: 3
 *                       star:
 *                         type: integer
 *                         example: 4
 *                       comment:
 *                         type: string
 *                         example: "Yaxshi o‘quv markazi!"
 *       500:
 *         description: Server xatosi
 */

route.get('/', async (req, res) => {
  try {
    const {
      userId,
      learningCenterId,
      star,
      minStar,
      maxStar,
      orderBy,
      orderDirection,
      page = 1,
      limit = 10,
    } = req.query;

    let whereClause = {};

    if (userId) whereClause.userId = parseInt(userId);
    if (learningCenterId)
      whereClause.learningCenterId = parseInt(learningCenterId);

    if (star) {
      whereClause.star = parseInt(star);
    } else {
      if (minStar && maxStar) {
        whereClause.star = {
          [Op.between]: [parseInt(minStar), parseInt(maxStar)],
        };
      } else if (minStar) {
        whereClause.star = { [Op.gte]: parseInt(minStar) };
      } else if (maxStar) {
        whereClause.star = { [Op.lte]: parseInt(maxStar) };
      }
    }

    let order = [['createdAt', 'DESC']];
    if (orderBy) {
      order = [
        [
          orderBy,
          orderDirection && orderDirection.toUpperCase() === 'ASC'
            ? 'ASC'
            : 'DESC',
        ],
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    console.log(learningCenterId);

    const { count, rows } = await Comments.findAndCountAll({
      where: whereClause,
      attributes: ['id', 'star'],
      include: [
        {
          model: Users,

          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: LearningCenter,
          attributes: ['id', 'name'],
        },
      ],
    });

    const totalStars = rows.reduce((sum, comment) => sum + comment.star, 0);
    const averageStar = rows.length ? totalStars / rows.length : 0;

    res.json({
      offset,
      limit,
      totalCount: count,
      averageStar: parseFloat(averageStar.toFixed(2)),
      comments: rows,
    });
  } catch (error) {
    res.status(500).send({ message: `Xatolik yuz berdi: ${error.message}` });
    console.error('Xatolik yuz berdi:', error);
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
 *     description: Foydalanuvchi yangi izoh qoldiradi
 *     tags:
 *       - Comment
 *    
 
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - learningCenterId
 *               - star
 *               - message
 *             properties:
 *               learningCenterId:
 *                 type: integer
 *                 example: 1
 *               star:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               message:
 *                 type: string
 *                 example: "Juda yaxshi o‘quv markazi!"
 *     responses:
 *       201:
 *         description: Yangi izoh qo'shildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 10
 *                
 *                 learningCenterId:
 *                   type: integer
 *                   example: 1
 *                 star:
 *                   type: integer
 *                   example: 5
 *                 message:
 *                   type: string
 *                   example: "Juda yaxshi o‘quv markazi!"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "star is required"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized user"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Server error"
 */

route.post('/', roleAuthMiddleware(['ADMIN', 'USER']), async (req, res) => {
  try {
    const { learningCenterId, star, message } = req.body;

    const userId = req?.userId;
    const learningExists = await LearningCenter.findByPk(learningCenterId);

    if (!learningExists) {
      return res.status(404).send({ message: 'edu center not found' });
    }
    const newComment = await Comments.create({
      userId,
      learningCenterId,
      star,
      message,
    });
    res.send(newComment);
    console.log(newComment);
  } catch (error) {
    console.log(error);

    res.status(500).send({ error: 'server error' });
  }
});

/**
 * @swagger
 * /comments/{id}:
 *   patch:
 *     summary: Izohni yangilash
 *     tags: [Comment]
 *
 *
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
 *
 *
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
