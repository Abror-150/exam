const express = require('express');
const route = express.Router();
const ResourceCategory = require('../models/resourceCategory');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const Resource = require('../models/resource');
const logger = require('../logger/logger');

/**
 * @swagger
 * /resource-categories:
 *   post:
 *     summary: Yangi ResourceCategory qo‘shish
 *     tags: [ResourceCategories]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - img
 *             properties:
 *               name:
 *                 type: string
 *               img:
 *                 type: string
 *     responses:
 *       201:
 *         description: ResourceCategory muvaffaqiyatli qo‘shildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ResourceCategory'
 *       401:
 *         description: Token yo‘q yoki noto‘g‘ri
 *       403:
 *         description: Ruxsat yo‘q (ADMIN yoki CEO emas)
 *       500:
 *         description: Server xatosi
 */
route.post('/', roleAuthMiddleware(['ADMIN', 'CEO']), async (req, res) => {
  try {
    const { name, img } = req.body;
    const existingCategory = await ResourceCategory.findOne({
      where: { name },
    });

    if (existingCategory) {
      logger.warn(`Category already exists: ${name}`);
      return res.status(400).json({ message: 'This category already exists' });
    }

    const resourceCategory = await ResourceCategory.create({
      name,
      img,
    });
    logger.info(`New category added: ${name}`);
    res.status(201).json({
      message: 'ResourceCategory added',
      data: resourceCategory,
    });
  } catch (error) {
    logger.error(`Error adding category: ${error.message}`);
    console.error(error);
    res.status(500).json({
      message: "ResourceCategory qo'shishda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resource-categories:
 *   get:
 *     summary: Barcha ResourceCategory’larni olish
 *     tags: [ResourceCategories]
 *     responses:
 *       200:
 *         description: Barcha ResourceCategory ro‘yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResourceCategory'
 *       500:
 *         description: Server xatosi
 */
route.get('/', async (req, res) => {
  try {
    const resourceCategories = await ResourceCategory.findAll({
      include: [{ model: Resource }],
    });
    logger.info('Fetched all categories');
    res.json({
      message: 'Barcha ResourceCategorylar',
      data: resourceCategories,
    });
  } catch (error) {
    logger.error(`Error fetching categories: ${error.message}`);
    console.error(error);
    res.status(500).json({
      message: "ResourceCategory'larni olishda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resource-categories:
 *   get:
 *     summary: Barcha ResourceCategory’larni olish (filtrlash, saralash, sahifalash qo‘shilgan)
 *     tags: [ResourceCategories]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Kategoriya nomi bo‘yicha filtr
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, createdAt]
 *         description: Saralash mezoni (name yoki createdAt)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Saralash tartibi (asc yoki desc)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Sahifa raqami
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Har bir sahifadagi elementlar soni
 *     responses:
 *       200:
 *         description: Barcha ResourceCategory ro‘yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResourceCategory'
 *                 total:
 *                   type: integer
 *                   description: Umumiy kategoriya soni
 *       500:
 *         description: Server xatosi
 */
route.get('/', async (req, res) => {
  try {
    let { name, sort = 'createdAt', order = 'desc', page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (name) {
      whereClause.name = { $like: `%${name}%` };    }

    const resourceCategories = await ResourceCategory.findAndCountAll({
      where: whereClause,
      include: [{ model: Resource }],
      order: [[sort, order]],
      limit,
      offset,
    });
    logger.info(`GET /resource-categories - page: ${page}, limit: ${limit}, sort: ${sort}, order: ${order}`);

    res.json({
      message: 'Barcha ResourceCategorylar',
      data: resourceCategories.rows,
      total: resourceCategories.count,
    });
  } catch (error) {
    logger.error(`Error fetching resource categories: ${error.message}`);
    console.error(error);
    res.status(500).json({
      message: "ResourceCategory'larni olishda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resource-categories/{id}:
 *   patch:
 *     summary: ResourceCategory’ni yangilash
 *     tags: [ResourceCategories]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ResourceCategory ID
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
 *         description: ResourceCategory yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ResourceCategory'
 *       404:
 *         description: ResourceCategory topilmadi
 *       401:
 *         description: Token yo‘q yoki noto‘g‘ri
 *       403:
 *         description: Ruxsat yo‘q (ADMIN yoki CEO emas)
 *       500:
 *         description: Server xatosi
 */
route.patch('/:id', roleAuthMiddleware(['ADMIN', 'CEO']), async (req, res) => {
  try {
    const resourceCategory = await ResourceCategory.findByPk(req.params.id);
    if (!resourceCategory) {
      logger.warn(`Category not found: ID ${req.params.id}`);
      return res.status(404).json({ message: 'ResourceCategory topilmadi' });
    }

    await resourceCategory.update(req.body);
    logger.info(`Category updated: ID ${req.params.id}`);
    res.json({
      message: 'ResourceCategory yangilandi',
      data: resourceCategory,
    });
  } catch (error) {
    logger.error(`Error updating category: ${error.message}`);
    console.error(error);
    res.status(500).json({
      message: 'ResourceCategory yangilashda xatolik',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resource-categories/{id}:
 *   delete:
 *     summary: ResourceCategory’ni o‘chirish
 *     tags: [ResourceCategories]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ResourceCategory ID
 *     responses:
 *       200:
 *         description: ResourceCategory o‘chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: ResourceCategory topilmadi
 *       401:
 *         description: Token yo‘q yoki noto‘g‘ri
 *       403:
 *         description: Ruxsat yo‘q (ADMIN yoki CEO emas)
 *       500:
 *         description: Server xatosi
 */
route.delete('/:id', roleAuthMiddleware(['ADMIN', 'CEO']), async (req, res) => {
  try {
    const resourceCategory = await ResourceCategory.findByPk(req.params.id);
    if (!resourceCategory) {
      logger.warn(`Category not found for deletion: ID ${req.params.id}`);
      return res.status(404).json({ message: 'ResourceCategory topilmadi' });
    }

    await resourceCategory.destroy();
    logger.info(`Category deleted: ID ${req.params.id}`);
    res.json({ message: 'ResourceCategory deleted' });
  } catch (error) {
    logger.error(`Error deleting category: ${error.message}`);
    console.error(error);
    res.status(500).json({
      message: "ResourceCategory o'chirishda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ResourceCategory:
 *       type: object
 *       required:
 *         - name
 *         - img
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         img:
 *           type: string
 */

module.exports = route;
