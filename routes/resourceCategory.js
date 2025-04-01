const express = require('express');
const route = express.Router();
const ResourceCategory = require('../models/resourceCategory');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const Resource = require('../models/resource');
const {
  ResourceCategoryValidation,
  ResourceCategoryValidationPatch,
} = require('../validations/resourceCategory');
const { Op } = require('sequelize');
const { getRouteLogger } = require('../logger/logger');
const { message } = require('../validations/learningCenter');

const resourceCategoryLogger = getRouteLogger(__filename);
/**
 * @swagger
 * /resource-categories:
 *   post:
 *     summary: Create a new resource category
 *     tags: [Resource Categories]
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
 *         description: ResourceCategory added
 *       400:
 *         description: Validation error or category exists
 *       500:
 *         description: Internal server error
 */
route.post('/', roleAuthMiddleware(['ADMIN', 'CEO']), async (req, res) => {
  let { error } = ResourceCategoryValidation.validate(req.body);
  if (error) {
    resourceCategoryLogger.log('warn', 'Validation error');
    return res.status(400).send({ error: error.details[0].message });
  }
  try {
    const { name, img } = req.body;
    const existingCategory = await ResourceCategory.findOne({
      where: { name },
    });

    if (existingCategory) {
      resourceCategoryLogger.log('warn', 'ResourceCategory already exists');
      return res.status(400).json({ message: 'This category already exists' });
    }

    const resourceCategory = await ResourceCategory.create({ name, img });
    resourceCategoryLogger.log('info', 'ResourceCategory added', {
      id: resourceCategory.id,
    });
    res
      .status(201)
      .json({ message: 'ResourceCategory added', data: resourceCategory });
  } catch (error) {
    resourceCategoryLogger.log('error', 'ResourceCategory creation error', {
      error: error.message,
    });
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
 *     summary: Get all resource categories with filtering, sorting, and pagination
 *     tags: [Resource Categories]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter categories by name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name]
 *         description: Sort categories by field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sorting order (ASC or DESC)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of resource categories
 *       500:
 *         description: Internal server error
 */
route.get('/', async (req, res) => {
  try {
    let {
      name,
      sortBy = 'createdAt',
      order = 'DESC',
      page = 1,
      limit = 10,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const filter = {};
    if (name) {
      filter.name = { [Op.like]: `%${name}%` };
    }

    const resourceCategories = await ResourceCategory.findAndCountAll({
      where: filter,
      include: [{ model: Resource }],
      order: [[sortBy, order]],
      limit,
      offset,
    });

    resourceCategoryLogger.log('info', 'Fetched all ResourceCategories', {
      count: resourceCategories.count,
    });
    res.json({
      message: 'All ResourceCategories',
      page,
      limit,
      total: resourceCategories.count,
      data: resourceCategories.rows,
    });
  } catch (error) {
    resourceCategoryLogger.log('error', 'Error fetching ResourceCategories', {
      error: error.message,
    });
    res.status(500).json({
      message: 'Error fetching ResourceCategories',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resource-categories/{id}:
 *   get:
 *     summary: Get a resource category by ID
 *     tags: [Resource Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ResourceCategory found
 *       404:
 *         description: ResourceCategory not found
 *       500:
 *         description: Internal server error
 */
route.get('/:id', async (req, res) => {
  try {
    const resourceCategory = await ResourceCategory.findByPk(req.params.id, {
      include: [{ model: Resource }],
    });
    if (!resourceCategory) {
      return res.status(404).json({ message: 'ResourceCategory not found' });
    }
    res.json({ message: 'ResourceCategory found', data: resourceCategory });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'ResourceCategory fetch error', error: error.message });
  }
});

/**
 * @swagger
 * /resource-categories/{id}:
 *   patch:
 *     summary: Update a resource category by ID
 *     tags: [Resource Categories]
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
 *               name:
 *                 type: string
 *               img:
 *                 type: string
 *     responses:
 *       200:
 *         description: ResourceCategory updated
 *       404:
 *         description: ResourceCategory not found
 *       500:
 *         description: Internal server error
 */

route.patch(
  '/:id',
  roleAuthMiddleware(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    let { error } = ResourceCategoryValidationPatch.validate(req.body);
    if (error) {
      resourceCategoryLogger.log('warn', 'Validation error in patch request');
      return res.status(400).send({ error: error.details[0].message });
    }
    try {
      let { name } = req.body;
      const resourceCategory = await ResourceCategory.findByPk(req.params.id);
      const resourceCategoryExists = await ResourceCategory.findOne({
        where: { name },
      });
      if (resourceCategoryExists) {
        return res
          .status(400)
          .json({ message: 'resourceCategory name already exists' });
      }

      if (!resourceCategory) {
        resourceCategoryLogger.log('warn', 'ResourceCategory not found', {
          id: req.params.id,
        });
        return res.status(404).json({ message: 'ResourceCategory not found' });
      }

      await resourceCategory.update(req.body);
      resourceCategoryLogger.log(
        'info',
        'ResourceCategory updated successfully',
        { id: resourceCategory.id }
      );
      res.json({ message: 'ResourceCategory updated', data: resourceCategory });
    } catch (error) {
      resourceCategoryLogger.log('error', 'Error updating ResourceCategory', {
        error: error.message,
      });
      res.status(500).json({
        message: 'ResourceCategory update error',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /resource-categories/{id}:
 *   delete:
 *     summary: Delete a resource category by ID
 *     tags: [Resource Categories]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: ResourceCategory deleted
 *       404:
 *         description: ResourceCategory not found
 *       500:
 *         description: Internal server error
 */

route.delete('/:id', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const resourceCategory = await ResourceCategory.findByPk(req.params.id);
    if (!resourceCategory) {
      resourceCategoryLogger.log('warn', 'ResourceCategory not found', {
        id: req.params.id,
      });
      return res.status(404).json({ message: 'ResourceCategory not found' });
    }

    await resourceCategory.destroy();
    resourceCategoryLogger.log(
      'info',
      'ResourceCategory deleted successfully',
      { id: req.params.id }
    );
    res.json(resourceCategory);
  } catch (error) {
    resourceCategoryLogger.log('error', 'Error deleting ResourceCategory', {
      error: error.message,
    });
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
});

module.exports = route;
