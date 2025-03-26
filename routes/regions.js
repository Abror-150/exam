const { Router } = require('express');
const { Op } = require('sequelize');
const route = Router();
<<<<<<< HEAD
const roleAuthMiddleware = require('../middlewares/roleAuth');
const Region = require('../models/regions');
const LearningCenter = require('../models/learningCenter');
const Branches = require('../models/branches');
const { regionSchema, message } = require('../validations/regions');
const Branch = require('../models/branches');
=======
const roleAuthMiddleware = require("../middlewares/roleAuth");
const Region = require("../models/regions");
const LearningCenter = require("../models/learningCenter");
const Branches = require("../models/branches");
const { regionSchema, message } = require("../validations/regions");
const Branch = require("../models/branches");
>>>>>>> daf8f6ad3187f9a3f63efdeddd6eb4052036758a

/**
 * @swagger
 * tags:
 *   name: Regions
 *   description: Viloyatlar bilan ishlash
 */

/**
 * @swagger
 * /regions:
 *   get:
 *     summary: Barcha viloyatlarni olish
 *     tags: [Regions]
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
 *         description: Sahifadagi elementlar soni
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Viloyat nomi bo‘yicha qidirish
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, name]
 *         description: Qaysi ustun bo‘yicha saralash (id yoki name)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Saralash tartibi (ASC - o‘sish tartibida, DESC - kamayish tartibida)
 *     responses:
 *       200:
 *         description: Viloyatlar ro‘yxati
 *       500:
 *         description: Server xatosi
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

    let data = await Region.findAll({
      where: whereClause,
      order: [[sortBy, order.toUpperCase()]],
      limit,
      offset: (page - 1) * limit,
      include: [
        {
          model: LearningCenter,
        },
        { model: Branch },
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
 * /regions/{id}:
 *   get:
 *     summary: Bitta viloyatni ID bo‘yicha olish
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Viloyat IDsi
 *     responses:
 *       200:
 *         description: Viloyat topildi
 *       404:
 *         description: Viloyat topilmadi
 */
route.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const region = await Region.findByPk(id, {
      include: [
        {
          model: LearningCenter,
          include: [
            {
              model: Branches,
            },
          ],
        },
      ],
    });
    if (!region) {
      return res.status(404).json({ error: 'viloyat topilmadi' });
    }
    res.json(region);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi', details: error.message });
  }
});

/**
 * @swagger
 * /regions:
 *   post:
 *     summary: Yangi viloyat qo‘shish
 *     tags: [Regions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Toshkent"
 *     responses:
 *       201:
 *         description: Viloyat yaratildi
 *       400:
 *         description: Xato so‘rov
 */

<<<<<<< HEAD
route.post('/', roleAuthMiddleware(['USER']), async (req, res) => {
=======
route.post("/", roleAuthMiddleware(["USER"]), async (req, res) => {
>>>>>>> daf8f6ad3187f9a3f63efdeddd6eb4052036758a
  try {
    const { error } = regionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    let { name } = req.body;
    let existRegion = await Region.findOne({ where: { name } });
    if (existRegion) {
      return res.status(401).send({ message: "region already exists" });
    }
    const one = await Region.create({ name });
    res.status(201).json(one);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi', details: error.message });
  }
});

/**
 * @swagger
 * /regions/{id}:
 *   patch:
 *     summary: Viloyat ma’lumotlarini yangilash
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Viloyat IDsi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Samarqand"
 *     responses:
 *       200:
 *         description: Yangilangan viloyat
 *       400:
 *         description: Xato so‘rov
 *       404:
 *         description: Viloyat topilmadi
 */
route.patch('/:id', roleAuthMiddleware(['USER']), async (req, res) => {
  try {
    const { error } = regionSchema.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }
    const { id } = req.params;
    const one = await Region.findByPk(id);
    if (!one) {
      return res.status(404).send({ error: 'viloyat topilmadi' });
    }
    await one.update(req.body);
    res.json(one);
  } catch (error) {
    res.status(500).json({ error: 'Server xatosi', details: error.message });
  }
});

/**
 * @swagger
 * /regions/{id}:
 *   delete:
 *     summary: Viloyatni o‘chirish
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Viloyat IDsi
 *     responses:
 *       200:
 *         description: Viloyat o‘chirildi
 *       404:
 *         description: Viloyat topilmadi
 */
route.delete('/:id', roleAuthMiddleware(['USER']), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Region.destroy({ where: { id } });
    if (deleted) {
      return res.send({ message: "viloyat o'chirildi" });
    }
    res.status(404).send({ error: 'viloyat topilmadi' });
  } catch (error) {
    res.status(500).send({ error: 'Server xatosi', details: error.message });
  }
});

module.exports = route;
