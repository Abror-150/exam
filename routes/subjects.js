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
      include: [
        { model: Branch },
        { model: LearningCenter, as: 'centers', through: { attributes: [] } },
      ],
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
 * /subjects/centers/{subjectId}:
 *   get:
 *     summary: Subject va unga tegishli Learning Centerlarni olish
 *     tags: [Subjects]
 *     description: Berilgan subjectId bo‘yicha subject va unga bog‘langan barcha Learning Centerlarni qaytaradi.
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subject ID
 *     responses:
 *       200:
 *         description: Subject va Learning Centerlar ro‘yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 8
 *                 name:
 *                   type: string
 *                   example: "Tarix"
 *                 centers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 2
 *                       name:
 *                         type: string
 *                         example: "Najot Ta'lim"
 *       404:
 *         description: Subject topilmadi
 *       500:
 *         description: Serverda xatolik
 */
route.get('/centers/:subjectId', async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await Subject.findByPk(subjectId, {
      include: {
        model: LearningCenter,
        as: 'centers',
        through: { attributes: [] },
      },
    });

    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    res.json({
      id: subject.id,
      name: subject.name,
      centers: subject.centers,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
    console.log(id);
    const oneId = await Subject.findByPk(id, {
      include: [
        { model: LearningCenter, as: 'centers', through: { attributes: [] } },
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
      let { name } = req.body;
      const { id } = req.params;
      const one = await Subject.findByPk(id);
      const oneExists = await Subject.findOne({ where: { name } });

      if (!one) {
        subjectLogger.log('warn', `Subject with ID ${id} not found for update`);
        return res.status(404).send({ error: 'Subject not found' });
      }

      if (oneExists) {
        return res.status(400).send({ message: 'subject already exists' });
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
    const subject = await Subject.findByPk(id);

    if (!subject) {
      subjectLogger.log('warn', `Subject with ID ${id} not found for deletion`);
      return res.status(404).json({ message: 'Subject not found' });
    }

    await subject.destroy();

    subjectLogger.log('info', `Subject with ID ${id} deleted successfully`);
    return res
      .status(200)
      .json({ message: `Subject with ID ${id} deleted successfully`, subject });
  } catch (error) {
    subjectLogger.log('error', `Error deleting subject: ${error.message}`);
    return res
      .status(500)
      .json({ error: 'Server error', details: error.message });
  }
});

module.exports = route;
