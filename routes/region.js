const express = require('express');
const route = express.Router();
const Regions = require('../models/regions');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const regionValidation = require('../validations/regions');
/**
 * @swagger
 * /regions:
 *   get:
 *     summary: Barcha viloyatlarni olish
 *     tags: [Regions]
 *     responses:
 *       200:
 *         description: Viloyatlar ro'yxati
 */
route.get('/', async (req, res) => {
  try {
    const data = await Regions.findAll();
    if (!data.length) return res.send({ message: 'viloyatlar yaratilmagan' });
    res.send(data);
  } catch (error) {
    res.send(`Xatolik yuz berdi: ${error.message}`);
  }
});

/**
 * @swagger
 * /Regionss/{id}:
 *   get:
 *     summary: Bitta viloyatni ID bo‘yicha olish
 *     tags: [Regions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Viloyat topildi
 */
route.get('/:id', async (req, res) => {
  try {
    const data = await Regions.findByPk(req.params.id);
    if (!data) return res.send('Region not found');
    res.send(data);
  } catch (error) {
    res.send(`Xatolik yuz berdi: ${error.message}`);
  }
});

/**
 * @swagger
 * /regions:
 *   post:
 *     summary: Yangi viloyat qo‘shish
 *     tags: [Regions]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Yangi viloyat qo'shildi
 */
route.post('/', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  // let { error } = regionValidation.validate(req.body);
  // if (error) {
  //   return res.status(400).json({ message: error.details[0].message });
  // }
  try {
    const { name } = req.body;

    const newRegions = await Regions.create({ name });
    // if (newRegions) {
    //   return res.status(401).send({ message: 'Region already exists' });
    // }
    res.send(newRegions);
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /regions/{id}:
 *   patch:
 *     summary: Viloyatni yangilash
 *     tags: [Regions]
 *     security:
 *       - BearerAuth: []
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
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Viloyat yangilandi
 */
route.patch(
  '/:id',
  roleAuthMiddleware(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const { name } = req.body;
      const data = await Regions.findByPk(req.params.id);
      if (!data) return res.send('Bunday ID bilan viloyat topilmadi.');

      await data.update({ name });
      res.send({ message: 'Region updated' });
    } catch (error) {
      res.status(500).send({ message: 'Internal server error' });
    }
  }
);

/**
 * @swagger
 * /regions/{id}:
 *   delete:
 *     summary: Viloyatni o‘chirish
 *     tags: [Regions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Viloyat o'chirildi
 */
route.delete('/:id', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const data = await Regions.findByPk(req.params.id);
    if (!data) return res.send('Bunday ID bilan viloyat topilmadi.');

    await data.destroy();
    res.send(data);
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

module.exports = route;
