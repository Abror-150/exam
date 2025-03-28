const { Router } = require('express');
const { Op } = require('sequelize');
const route = Router();
const roleAuthMiddleware = require('../middlewares/roleAuth');
const {
  subjectSchema,
  subjectPatchValidation,
} = require('../validations/subjects');
const Subject = require('../models/subjects');
const LearningCenter = require('../models/learningCenter');
const Branch = require('../models/branches');
const { getRouteLogger } = require('../logger/logger');
const { message } = require('../validations/learningCenter');

const subjectLogger = getRouteLogger(__filename);

/**
 * @swagger
 * tags:
 *   name: Subjects
 *   description: Subject management APIs
 */

/**
 * @swagger
 * /subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Subjects]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of records per page (default 10)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Column to sort by (default 'id')
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sorting order (default 'ASC')
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter subjects by name
 *     responses:
 *       200:
 *         description: A list of subjects
 *       500:
 *         description: Server error
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

    let data = await Subject.findAll({
      where: whereClause,
      order: [[sortBy, order.toUpperCase()]],
      limit,
      offset: (page - 1) * limit,
      include: [{ model: Branch }],
    });

    subjectLogger.log('info', 'Subjects fetched successfully');
    res.status(200).json(data);
  } catch (error) {
    subjectLogger.log('error', `Error fetching subjects: ${error.message}`);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

/**
 * @swagger
 * /subjects/{id}:
 *   get:
 *     summary: Get a subject by ID
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject data
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Server error
 */

route.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const oneId = await Subject.findByPk(id, {
      include: [
        { model: LearningCenter, as: 'markazlar', through: { attributes: [] } },
        { model: Branch },
      ],
    });

    if (!oneId) {
      subjectLogger.log('warn', `Subject with ID ${id} not found`);
      return res.status(404).json({ error: 'Subject not found' });
    }

    subjectLogger.log('info', `Fetched subject with ID ${id}`);
    res.json(oneId);
  } catch (error) {
    subjectLogger.log(
      'error',
      `Error fetching subject by ID: ${error.message}`
    );
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

/**
 * @swagger
 * /subjects:
 *   post:
 *     summary: Create a new subject
 *     tags: [Subjects]
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
 *                 description: Name of the subject
 *               img:
 *                 type: string
 *                 description: Image URL of the subject
 *     responses:
 *       201:
 *         description: Subject created successfully
 *       400:
 *         description: Validation error or subject already exists
 *       500:
 *         description: Server error
 */

route.post('/', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  const { error } = subjectSchema.validate(req.body);
  if (error) {
    subjectLogger.log('warn', `Validation error: ${error.details[0].message}`);
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const { name, img } = req.body;
    const existingSubject = await Subject.findOne({ where: { name } });

    if (existingSubject) {
      subjectLogger.log('warn', `Subject '${name}' already exists`);
      return res.status(400).json({ message: 'This subject already exists' });
    }

    const one = await Subject.create({ name, img });
    subjectLogger.log('info', `Subject '${name}' created successfully`);
    res.status(201).json(one);
  } catch (error) {
    subjectLogger.log('error', `Error creating subject: ${error.message}`);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

/**
 * @swagger
 * /subjects/{id}:
 *   patch:
 *     summary: Update a subject
 *     tags: [Subjects]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name of the subject
 *               img:
 *                 type: string
 *                 description: Updated image URL of the subject
 *     responses:
 *       200:
 *         description: Subject updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Server error
 */

route.patch(
  '/:id',
  roleAuthMiddleware(['ADMIN', 'SUPER_ADMIN']),
  async (req, res) => {
    let { error } = subjectPatchValidation.validate(req.body);
    if (error) {
      return res.status(400).send({ message: error.details[0].message });
    }
    try {
      const { id } = req.params;
      const one = await Subject.findByPk(id);

      if (!one) {
        subjectLogger.log('warn', `Subject with ID ${id} not found for update`);
        return res.status(404).send({ error: 'Subject not found' });
      }

      await one.update(req.body);
      subjectLogger.log('info', `Subject with ID ${id} updated successfully`);
      res.json(one);
    } catch (error) {
      subjectLogger.log('error', `Error updating subject: ${error.message}`);
      res.status(500).json({ error: 'Server error', details: error.message });
    }
  }
);

/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     summary: Delete a subject
 *     tags: [Subjects]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject deleted successfully
 *       404:
 *         description: Subject not found
 *       500:
 *         description: Server error
 */

route.delete('/:id', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Subject.destroy({ where: { id } });

    if (deleted) {
      subjectLogger.log('info', `Subject with ID ${id} deleted successfully`);
      return res.send({ message: 'Subject deleted' });
    }

    subjectLogger.log('warn', `Subject with ID ${id} not found for deletion`);
    res.status(404).send({ error: 'Subject not found' });
  } catch (error) {
    subjectLogger.log('error', `Error deleting subject: ${error.message}`);
    res.status(500).send({ error: 'Server error', details: error.message });
  }
});

module.exports = route;
