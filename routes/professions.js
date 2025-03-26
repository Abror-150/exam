const { Router } = require('express');
const { Op } = require('sequelize');
const route = Router();
const roleAuthMiddleware = require('../middlewares/roleAuth');
const professionSchema = require('../validations/professions');
const LearningCenter = require('../models/learningCenter');
const Profession = require('../models/professions');
const Field = require('../models/fields');

/**
 * @swagger
 * /professions:
 *   get:
 *     summary: Kasblarni olish
 *     tags: [Professions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Sahifa raqami
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Bir sahifadagi yozuvlar soni
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Kasb nomi bo‘yicha filterlash
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, name, createdAt, updatedAt]
 *         description: Saralash maydoni (id, name, createdAt, updatedAt)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Saralash tartibi (ASC yoki DESC)
 *     responses:
 *       200:
 *         description: Kasblar ro‘yxati
 */
route.get('/', async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      sortBy = 'id',
      order = 'ASC',
      name,
    } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const whereClause = {};
    if (name) {
      whereClause.name = { [Op.like]: `%${name}%` };
    }

    let data = await Profession.findAll({
      where: whereClause,
      order: [[sortBy, order.toUpperCase()]],
      limit,
      offset: (page - 1) * limit,
      include: [
        {
          model: LearningCenter,
          as: 'userLearningCenter',
          through: { attributes: [] },
        },
      ],
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server xatosi', details: error.message });
  }
});

/**
 * @swagger
 * /professions/{id}:
 *   get:
 *     summary: ID bo‘yicha kasbni olish
 *     tags: [Professions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kasb IDsi
 *     responses:
 *       200:
 *         description: Kasb ma’lumotlari
 *       404:
 *         description: Kasb topilmadi
 */
route.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profession = await Profession.findByPk(id, {
      include: [
        {
          model: LearningCenter,
          as: 'markaz',
          through: { attributes: [] },
        },
      ],
    });
    if (!profession) {
      return res.status(404).json({ error: 'Kasb topilmadi' });
    }
    res.json(profession);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi', details: error.message });
  }
});

/**
 * @swagger
 * /professions:
 *   post:
 *     summary: Yangi kasb qo‘shish
 *     tags: [Professions]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               img:
 *                 type: string
 *     responses:
 *       201:
 *         description: Kasb muvaffaqiyatli qo‘shildi
 *       400:
 *         description: Noto‘g‘ri ma'lumot
 *       500:
 *         description: Server xatosi
 */
route.post('/', async (req, res) => {
  const { error } = professionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  try {
    const { name } = req.body;
    const exitingName = await Profession.findOne({
      where: { name },
    });

    if (exitingName) {
      return res.status(400).json({ message: 'Profession already exists' });
    }
    const newProfession = await Profession.create(req.body);
    res.status(201).json(newProfession);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi', details: error.message });
  }
});

/**
 * @swagger
 * /professions/{id}:
 *   patch:
 *     summary: Kasb ma'lumotlarini yangilash
 *     tags: [Professions]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kasb IDsi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               img:
 *                 type: string
 *     responses:
 *       200:
 *         description: Kasb muvaffaqiyatli yangilandi
 *       400:
 *         description: Noto‘g‘ri ma'lumot
 *       404:
 *         description: Kasb topilmadi
 *       500:
 *         description: Server xatosi
 */
route.patch(
  '/:id',
  roleAuthMiddleware(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { error } = professionSchema.validate(req.body);
      if (error) {
        return res.status(400).send({ error: error.details[0].message });
      }
      const { id } = req.params;
      const one = await Profession.findByPk(id);
      if (!one) {
        return res.status(404).send({ error: 'Kasb topilmadi' });
      }
      await one.update(req.body);
      res.json(one);
    } catch (error) {
      res.status(500).json({ error: 'Server xatosi', details: error.message });
    }
  }
);

/**
 * @swagger
 * /professions/{id}:
 *   delete:
 *     summary: Kasbni o‘chirish
 *     tags: [Professions]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kasb IDsi
 *     responses:
 *       200:
 *         description: Kasb muvaffaqiyatli o‘chirildi
 *       404:
 *         description: Kasb topilmadi
 *       500:
 *         description: Server xatosi
 */
route.delete('/:id', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Profession.destroy({ where: { id } });
    if (deleted) {
      return res.send({ message: "Kasb o'chirildi" });
    }
    res.status(404).send({ error: 'Kasb topilmadi' });
  } catch (error) {
    res.status(500).send({ error: 'Server xatosi', details: error.message });
  }
});

module.exports = route;
