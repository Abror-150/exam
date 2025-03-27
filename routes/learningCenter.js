const express = require('express');

const route = express.Router();
const LearningCenter = require('../models/learningCenter');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const learningCenterValidation = require('../validations/learningCenter');
const Branch = require('../models/branches');
const Profession = require('../models/professions');
const Comments = require('../models/comment');
const Region = require('../models/regions');
const { Op } = require('sequelize');
const Users = require('../models/user');
const Subject = require('../models/subjects');
const SubCenter = require('../models/subCenter');
const Field = require('../models/fields');
const Like = require('../models/likes');
const { Sequelize } = require('sequelize');

/**
 * @swagger
 * /learning-centers:
 *   post:
 *     summary: Create a new Learning Center
 *     description: Only users with 'ADMIN' or 'CEO' roles can create a learning center.
 *
 *     tags:
 *       - Learning Centers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - img
 *               - address
 *               - regionId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Najot Ta'lim"
 *               phone:
 *                 type: string
 *                 example: "+998901234567"
 *               img:
 *                 type: string
 *                 example: "https://example.com/image.png"
 *               address:
 *                 type: string
 *                 example: "Toshkent, Chilonzor 9 kvartal"
 *               regionId:
 *                 type: integer
 *                 example: 3
 *
 *               professionsId:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *               subjectsId:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       201:
 *         description: Learning Center successfully created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 *       403:
 *         description: Forbidden (User does not have required role)
 *       500:
 *         description: Server error
 */

route.post('/', roleAuthMiddleware(['ADMIN', 'CEO']), async (req, res) => {
  let { error } = learningCenterValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const { professionsId, subjectsId, name, phone, regionId, ...rest } =
      req.body;
    const userId = req?.userId;

    const region = await Region.findByPk(regionId);
    if (!region) {
      return res.status(404).send({ message: 'region not found' });
    }

    let exists = await LearningCenter.findOne({ where: { name } });
    if (exists) {
      return res.status(401).send({ message: 'name already exists' });
    }

    let PhoneExists = await LearningCenter.findOne({ where: { phone } });
    if (PhoneExists) {
      return res.status(401).send({ message: 'phone already exists' });
    }

    const learningCenter = await LearningCenter.create({
      ...rest,
      regionId,
      userId,
      name,
      phone,
    });

    const existingProfessions = await Profession.findAll({
      where: { id: professionsId },
      attributes: ['id'],
    });

    const existingIds = existingProfessions.map((p) => p.id);
    const invalidIds = professionsId.filter((id) => !existingIds.includes(id));

    if (invalidIds.length > 0) {
      return res.status(404).json({
        message: 'Not Found',
      });
    }

    const professionData = professionsId.map((id) => ({
      professionId: id,
      learningCenterId: learningCenter.id,
    }));

    await Field.bulkCreate(professionData);

    if (subjectsId && subjectsId.length > 0) {
      const subjectData = subjectsId.map((id) => ({
        subjectId: id,
        learningCenterId: learningCenter.id,
      }));
      await SubCenter.bulkCreate(subjectData);
    }

    res.status(201).send({
      message: 'Learning Center created',
      data: learningCenter,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /learning-centers:
 *   get:
 *     summary: Get all Learning Centers with filters, sorting, and pagination
 *     tags: [Learning Centers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search learning centers by name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt]
 *         description: Column to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sorting order (ascending or descending)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of learning centers
 *       500:
 *         description: Server error
 */

route.get('/', async (req, res) => {
  try {
    let { search, sortBy, order, page, limit } = req.query;

    sortBy = sortBy || 'createdAt';
    order = order || 'DESC';
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    let offset = (page - 1) * limit;

    let whereCondition = {};
    if (search) {
      whereCondition.name = { [Op.like]: `%${search}%` };
    }

    const learningCenters = await LearningCenter.findAndCountAll({
      // attributes: [
      //   'id',
      //   'name',
      //   'address',
      //   [Sequelize.fn('COUNT', Sequelize.col('Likes.id')), 'numberOfLikes'],
      // ],
      include: [
        {
          model: Branch,

          attributes: ['id', 'name', 'address'],
        },
        { model: Region, attributes: ['name'] },
        {
          model: Users,
          as: 'users',
          attributes: ['id', 'firstName', 'lastName'],
        },
        { model: Like, attributes: [] },
        {
          model: Subject,

          through: { attributes: [] },
        },
        { model: Comments },
        { model: Profession },
      ],
      where: whereCondition,
      order: [[sortBy, order]],
      limit,
      offset,
      // group: ['LearningCenter.id'],
    });

    res.status(200).send({
      total: learningCenters.count.length,
      page,
      limit,
      data: learningCenters.rows,
    });
  } catch (error) {
    res.status(500).send({
      message: 'Error fetching Learning Centers',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /learning-centers/{id}:
 *   get:
 *     summary: Get a single Learning Center by ID
 *     tags: [Learning Centers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Learning Center data
 *       404:
 *         description: Learning Center not found
 */

route.get(
  '/:id',
  roleAuthMiddleware(['ADMIN', 'SUPER_ADMIN', 'USER']),
  async (req, res) => {
    try {
      const learningCenter = await LearningCenter.findByPk(req.params.id);
      if (!learningCenter) {
        return res.status(404).send({ message: 'Learning Center not found' });
      }
      res
        .status(200)
        .send({ message: 'Learning center', data: learningCenter });
    } catch (error) {
      res.status(500).send({
        message: 'Error fetching Learning Center',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /learning-centers/{id}:
 *   patch:
 *     summary: Update a Learning Center by ID
 *
 *
 *     tags: [Learning Centers]
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
 *     responses:
 *       200:
 *         description: Learning Center updated
 *       404:
 *         description: Learning Center not found
 */

route.patch(
  '/:id',
  roleAuthMiddleware(['ADMIN', 'CEO', 'SUPER_ADMIN']),
  async (req, res) => {
    try {
      const learningCenter = await LearningCenter.findByPk(req.params.id);
      if (!learningCenter)
        return res.status(404).send({ message: 'Learning Center not found' });
      await learningCenter.update(req.body);
      res
        .status(200)
        .send({ message: 'Learning Center updated', data: learningCenter });
    } catch (error) {
      res.status(500).send({
        message: 'Error updating Learning Center',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /learning-centers/{id}:
 *   delete:
 *     summary: Delete a Learning Center by ID
 *
 *
 *     tags: [Learning Centers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Learning Center deleted
 *       404:
 *         description: Learning Center not found
 */
route.delete('/:id', roleAuthMiddleware(['ADMIN', 'CEO']), async (req, res) => {
  try {
    const learningCenter = await LearningCenter.findByPk(req.params.id);
    if (!learningCenter)
      return res.status(404).send({ message: 'Learning Center not found' });
    await learningCenter.destroy();
    res.status(200).send({ message: 'Learning Center deleted' });
  } catch (error) {
    res.status(500).send({
      message: 'Error deleting Learning Center',
      error: error.message,
    });
  }
});

module.exports = route;
