const express = require('express');
const route = express.Router();
const Resource = require('../models/resource');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const Users = require('../models/user');
const ResourceCategory = require('../models/resourceCategory');
const {
  ResourcePatchValidation,
  ResourceValidation,
} = require('../validations/resource');
const { getRouteLogger } = require('../logger/logger');
const { Op, Sequelize } = require('sequelize');
const { message } = require('../validations/learningCenter');

const resourceLogger = getRouteLogger(__filename);

/**
 * @swagger
 * /resources:
 *   post:
 *     summary: Yangi Resource qo‘shish
 *     tags: [Resources]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - file
 *               - img
 *               - describtion
 *               - link
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               file:
 *                 type: string
 *               img:
 *                 type: string
 *               describtion:
 *                 type: string
 *               link:
 *                 type: string
 *               resourceCategoriesId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Resource muvaffaqiyatli qo‘shildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       401:
 *         description: Token yo‘q yoki noto‘g‘ri
 *       403:
 *         description: Ruxsat yo‘q (ADMIN yoki CEO emas)
 *       500:
 *         description: Server xatosi
 */

route.post(
  '/',
  roleAuthMiddleware(['ADMIN', 'USER', 'CEO']),
  async (req, res) => {
    let { error } = ResourceValidation.validate(req.body);
    if (error) {
      resourceLogger.log('warn', 'validation error');
      return res.status(400).send({ error: error.details[0].message });
    }
    try {
      const { name, file, img, describtion, link, resourceCategoriesId } =
        req.body;
      const categoryExists = await ResourceCategory.findByPk(
        resourceCategoriesId
      );
      if (!categoryExists) {
        resourceLogger.log('warn', 'category  not found');

        return res
          .status(404)
          .json({ message: 'resourceCategories not found' });
      }
      const userId = req.userId;

      const existingResource = await Resource.findOne({
        where: { name },
      });

      if (existingResource) {
        resourceLogger.log('warn', 'resource already ');
        return res
          .status(400)
          .json({ message: 'This resource already exists' });
      }

      const category = await ResourceCategory.findByPk(resourceCategoriesId);
      if (!category) {
        return res
          .status(404)
          .json({ message: 'resourceCategories not found' });
      }

      const resource = await Resource.create({
        name,
        file,
        img,
        describtion,
        link,
        userId,
        resourceCategoriesId,
      });
      resourceLogger.log('info', 'post boldi');
      res.status(201).json({
        message: 'Resource added',
        data: resource,
      });
    } catch (error) {
      resourceLogger.log('error', 'internal server error');

      console.error(error);
      res.status(500).json({
        message: "Resource qo'shishda xatolik",
        error: error.message,
      });
    }
  }
);
/**
 * @swagger
 * /resources/{id}:
 *   patch:
 *     summary: Resource’ni yangilash
 *     tags: [Resources]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               file:
 *                 type: string
 *               img:
 *                 type: string
 *               describtion:
 *                 type: string
 *               link:
 *                 type: string
 *               resourceCategoriesId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Resource yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Resource topilmadi
 *       401:
 *         description: Token yo‘q yoki noto‘g‘ri
 *       403:
 *         description: Ruxsat yo‘q (ADMIN yoki CEO emas)
 *       500:
 *         description: Server xatosi
 */
route.patch(
  '/:id',
  roleAuthMiddleware(['ADMIN', 'USER', 'CEO']),
  async (req, res) => {
    let { error } = ResourcePatchValidation.validate(req.body);

    if (error) {
      resourceLogger.log('warn', 'validation error', {
        details: error.details,
      });
      return res.status(400).json({
        error: error.details[0].message,
      });
    }

    try {
      let { name } = req.body;
      const resource = await Resource.findByPk(req.params.id);
      let resourceExists = await Resource.findOne({ where: { name } });
      if (resourceExists) {
        return res
          .status(400)
          .send({ message: 'resouce name already updated' });
      }

      if (!resource) {
        resourceLogger.log('warn', 'resource not found');
        return res.status(404).json({ message: 'Resource topilmadi' });
      }

      await resource.update(req.body);

      resourceLogger.log('info', 'Resource updated');
      res.json({
        message: 'Resource updated',
        data: resource,
      });
    } catch (error) {
      resourceLogger.log('error', 'internal server error', {
        error: error.message,
      });
      console.error('Error:', error);
      res.status(500).json({
        message: 'Resource yangilashda xatolik',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /resources:
 *   get:
 *     summary: Barcha resurslarni olish
 *     description: Resurslarni qidirish, saralash va sahifalash orqali olish.
 *     tags: [Resources]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Sahifa raqami (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Har bir sahifadagi elementlar soni (default 10)
 *       - in: query
 *         name: nameSearch
 *         schema:
 *           type: string
 *         description: Nomi bo‘yicha qidirish
 *       - in: query
 *         name: descriptionSearch
 *         schema:
 *           type: string
 *         description: Tavsifi bo‘yicha qidirish
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, name, describtion, createdAt, updatedAt]
 *         description: Saralash uchun ustun nomi
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Saralash tartibi (ASC yoki DESC)
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli javob
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: All resources
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Resource Name"
 *                       describtion:
 *                         type: string
 *                         example: "Resource Description"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-03-31T12:00:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-03-31T12:30:00Z"
 *       400:
 *         description: Noto‘g‘ri so‘rov parametrlari
 *       500:
 *         description: Server xatosi
 */

route.get('/', async (req, res) => {
  try {
    let { page, limit, nameSearch, descriptionSearch, sortBy, order } =
      req.query;

    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    let offset = (page - 1) * limit;

    let where = {};
    if (nameSearch) {
      where.name = { [Op.like]: `%${nameSearch}%` };
    }
    if (descriptionSearch) {
      where.describtion = { [Op.like]: `%${descriptionSearch}%` };
    }

    const validSortColumns = [
      'id',
      'name',
      'describtion',
      'createdAt',
      'updatedAt',
    ];
    if (sortBy && !validSortColumns.includes(sortBy)) {
      return res.status(400).json({
        message: `Invalid sortBy value. Allowed: ${validSortColumns.join(
          ', '
        )}`,
      });
    }

    order = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    let orderBy = [['createdAt', 'DESC']];
    if (sortBy) {
      orderBy = [[Sequelize.col(sortBy), order]];
    }

    const resources = await Resource.findAndCountAll({
      where,
      include: [{ model: Users }],
      limit,
      offset,
      order: orderBy,
    });

    resourceLogger.log('info', 'get qilindi');

    res.json({
      message: 'All resources',
      page,
      limit,
      total: resources.count,
      data: resources.rows,
    });
  } catch (error) {
    resourceLogger.log('error', 'internal server error');
    console.error(error);
    res.status(500).json({
      message: 'Resourclarni olishda xatolik',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resources/{id}:
 *   get:
 *     summary: Bitta resource’ni ID bo‘yicha olish
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource topildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Resource topilmadi
 *       500:
 *         description: Server xatosi
 */
route.get('/:id', async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id, {
      include: [{ model: Users }],
    });
    if (!resource) {
      resourceLogger.log('warn', 'resource not found');

      return res.status(404).json({ message: 'Resource not found' });
    }
    resourceLogger.log('info', 'get id  qilindi');
    res.json({
      message: 'Resource topildi',
      data: resource,
    });
  } catch (error) {
    resourceLogger.log('error', 'internal server error');
    console.error(error);
    res.status(500).json({
      message: 'Resource olishda xatolik',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resources/{id}:
 *   delete:
 *     summary: Resource’ni o‘chirish
 *     tags: [Resources]
 *
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource o‘chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Resource topilmadi
 *       401:
 *         description: Token yo‘q yoki noto‘g‘ri
 *       403:
 *         description: Ruxsat yo‘q (ADMIN yoki CEO emas)
 *       500:
 *         description: Server xatosi
 */
route.delete(
  '/:id',
  roleAuthMiddleware(['ADMIN', 'CEO', 'USER']),
  async (req, res) => {
    try {
      const resource = await Resource.findByPk(req.params.id);
      if (!resource) {
        resourceLogger.log('warn', 'resouce not found');

        return res.status(404).json({ message: 'Resource topilmadi' });
      }
      resourceLogger.log('info', ' delele qilindi');

      await resource.destroy();
      res.json(resource);
    } catch (error) {
      resourceLogger.log('error', 'internal server error');

      console.error(error);
      res.status(500).json({
        message: 'Resource delete error',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Resource:
 *       type: object
 *       required:
 *         - name
 *         - file
 *         - img
 *         - describtion
 *         - link
 *
 *         - categoryId
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         file:
 *           type: string
 *         img:
 *           type: string
 *         describtion:
 *           type: string
 *         link:
 *           type: string
 *
 *         categoryId:
 *           type: integer
 */

module.exports = route;
