const express = require('express');

const route = express.Router();
const LearningCenter = require('../models/learningCenter');
const {
  learningCenterValidation,
  learningCenterValidationPatch,
} = require('../validations/learningCenter');
const Branch = require('../models/branches');
const Comments = require('../models/comment');
const { Op } = require('sequelize');
const Users = require('../models/user');
const Subject = require('../models/subjects');
const SubCenter = require('../models/subCenter');
const Field = require('../models/fields');
const Like = require('../models/likes');
const { Sequelize } = require('sequelize');
const { getRouteLogger } = require('../logger/logger');
const { message } = require('../validations/regions');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const Profession = require('../models/professions');
const Region = require('../models/regions');

const centerLogger = getRouteLogger(__filename);
/**
 * @swagger
 * /learning-centers:
 *   post:
 *     summary: Create a new Learning Center
 *     tags: [Learning Centers]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, regionId]
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               regionId:
 *                 type: integer
 *               img:
 *                 type: string
 *               address:
 *                 type: string
 *
 *
 *     responses:
 *       201:
 *         description: Learning Center created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Region not found
 *       500:
 *         description: Server error
 */
route.post('/', roleAuthMiddleware(['ADMIN', 'CEO']), async (req, res) => {
  let { error } = learningCenterValidation.validate(req.body);
  if (error) {
    centerLogger.log('warn', 'validation error');
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const { name, phone, regionId, ...rest } = req.body;
    const userId = req?.userId;

    let exists = await LearningCenter.findOne({ where: { name } });
    if (exists) {
      return res.status(400).json({ message: 'Name already exists' });
    }

    let phoneExists = await LearningCenter.findOne({ where: { phone } });
    if (phoneExists) {
      return res.status(400).json({ message: 'Phone already exists' });
    }

    const region = await Region.findByPk(regionId);
    if (!region) {
      return res.status(404).json({ message: 'Region not found' });
    }

    const learningCenter = await LearningCenter.create({
      name,
      phone,
      regionId,
      userId,
      ...rest,
    });

    res.status(201).json({
      message: 'Learning Center created successfully',
      data: learningCenter,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @swagger
 * /learning-centers/professions:
 *   post:
 *     summary: Learning Centerga new professions add
 *     description: Admin yoki CEO Learning Centerga professions bog‘laydi.
 *     tags: [Learning Centers]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - learningCenterId
 *               - professionsId
 *             properties:
 *               learningCenterId:
 *                 type: integer
 *                 example: 1
 *                 description: Bog‘lanayotgan Learning Centerning ID-si
 *               professionsId:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *                 description: Bog‘lanayotgan professions ID-lari
 *     responses:
 *       201:
 *         description: Professions muvaffaqiyatli bog‘landi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Professions linked successfully!
 *       400:
 *         description: Yaroqsiz ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: ProfessionsId must be a non-empty array
 *       404:
 *         description: Learning Center yoki profession topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Some professions not found
 *                 invalidIds:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [5, 6]
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   example: Some internal server error message
 */

route.post(
  '/professions',
  roleAuthMiddleware(['ADMIN', 'CEO']),
  async (req, res) => {
    try {
      const { learningCenterId, professionsId } = req.body;

      const learningCenter = await LearningCenter.findByPk(learningCenterId);
      if (!learningCenter) {
        return res.status(404).json({ message: 'Learning Center not found' });
      }

      if (!Array.isArray(professionsId) || professionsId.length === 0) {
        return res
          .status(400)
          .json({ message: 'ProfessionsId must be a non-empty array' });
      }

      const validProfessions = await Profession.findAll({
        where: { id: professionsId },
        attributes: ['id', 'name'],
      });

      const validIds = validProfessions.map((p) => p.id);
      const invalidIds = professionsId.filter((id) => !validIds.includes(id));

      if (invalidIds.length > 0) {
        return res
          .status(404)
          .json({ message: 'Some professions not found', invalidIds });
      }

      const existingFields = await Field.findAll({
        where: {
          learningCenterId,
          professionsId: validIds,
        },
        attributes: ['professionsId'],
      });

      const existingIds = existingFields.map((f) => f.professionsId);
      const newProfessions = validProfessions.filter(
        (p) => !existingIds.includes(p.id)
      );

      if (existingIds.length > 0) {
        return res.status(409).json({
          message: 'Some professions are already added',
          alreadyExists: validProfessions.filter((p) =>
            existingIds.includes(p.id)
          ),
        });
      }

      const professionData = newProfessions.map((p) => ({
        professionsId: p.id,
        learningCenterId,
      }));

      await Field.bulkCreate(professionData);

      res.status(201).json({
        message: 'Professions successfully added',
        addedProfessions: newProfessions,
      });
    } catch (error) {
      console.log(error);

      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

/**
 * @swagger
 * /learning-centers/subjects:
 *   post:
 *     summary: Learning Centerga yangi subjects bog‘lash
 *     description: Admin yoki CEO Learning Centerga subjects bog‘laydi.
 *     tags: [Learning Centers]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - learningCenterId
 *               - subjects
 *             properties:
 *               learningCenterId:
 *                 type: integer
 *                 example: 1
 *                 description: Bog‘lanayotgan Learning Centerning ID-si
 *               subjects:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *                 description: Bog‘lanayotgan subjects ID-lari
 *     responses:
 *       201:
 *         description: Subjects muvaffaqiyatli bog‘landi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subjects linked successfully!
 *       400:
 *         description: Yaroqsiz ma'lumotlar
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subjects must be a non-empty array
 *       404:
 *         description: Learning Center yoki subject topilmadi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Some subjects not found
 *                 invalidIds:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [5, 6]
 *       500:
 *         description: Server xatosi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 *                 error:
 *                   type: string
 *                   example: Some internal server error message
 */

route.post(
  '/subjects',
  roleAuthMiddleware(['ADMIN', 'CEO']),
  async (req, res) => {
    try {
      const { learningCenterId, subjects } = req.body;

      const learningCenter = await LearningCenter.findByPk(learningCenterId);
      if (!learningCenter) {
        return res.status(404).json({ message: 'Learning Center not found' });
      }

      if (!Array.isArray(subjects) || subjects.length === 0) {
        return res
          .status(400)
          .json({ message: 'Subjects must be a non-empty array' });
      }

      const validSubjects = await Subject.findAll({
        where: { id: subjects },
        attributes: ['id', 'name'],
      });

      const validIds = validSubjects.map((s) => s.id);
      const invalidIds = subjects.filter((id) => !validIds.includes(id));

      if (invalidIds.length > 0) {
        return res.status(404).json({
          message: 'Some subjects not found',
          invalidIds,
        });
      }

      const existingRelations = await SubCenter.findAll({
        where: {
          learningCenterId,
          subjectId: validIds,
        },
        attributes: ['subjectId'],
      });

      const existingIds = existingRelations.map((rel) => rel.subjectId);
      const newSubjects = validSubjects.filter(
        (s) => !existingIds.includes(s.id)
      );

      if (existingIds.length > 0) {
        return res.status(409).json({
          message: 'Some subjects are already created',
          alreadyLinked: validSubjects.filter((s) =>
            existingIds.includes(s.id)
          ),
        });
      }

      const subjectData = newSubjects.map((s) => ({
        subjectId: s.id,
        learningCenterId,
      }));

      await SubCenter.bulkCreate(subjectData);

      res.status(201).json({
        message: 'Subjects created',
        addedSubjects: newSubjects,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Server error',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /learning-centers:
 *   get:
 *     summary: Get a list of learning centers
 *     tags: [Learning Centers]
 *     description: Fetch all learning centers with optional filters like search, sorting, and pagination.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search learning centers by name.
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name, numberOfLikes]
 *         description: Field to sort by.
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sorting order.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of results per page.
 *     responses:
 *       200:
 *         description: A list of learning centers.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of learning centers.
 *                 page:
 *                   type: integer
 *                   description: Current page number.
 *                 limit:
 *                   type: integer
 *                   description: Number of results per page.
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Learning center ID.
 *                       name:
 *                         type: string
 *                         description: Learning center name.
 *                       numberOfLikes:
 *                         type: integer
 *                         description: Number of likes.
 *       500:
 *         description: Internal server error.
 */

route.get(
  '/',

  async (req, res) => {
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
        include: [
          { model: Branch, attributes: ['id', 'name', 'address'] },
          { model: Region, attributes: ['name'] },

          { model: Region, attributes: ['name'] },
          {
            model: Users,
            as: 'registeredUser',
            attributes: ['id', 'firstName', 'lastName'],
            through: { attributes: [] },
          },
          { model: Subject, as: 'subjects', through: { attributes: [] } },
          { model: Like, attributes: ['id', 'learningCenterId', 'userId'] },
          {
            model: Subject,
            as: 'subjects',

            through: { attributes: [] },
          },
          {
            model: Comments,
            attributes: ['id', 'message', 'userId', 'learningCenterId'],
          },
          // { model: Profession },
        ],
        attributes: {
          include: [
            [
              Sequelize.literal(`(
          SELECT COUNT(*) 
          FROM layklar 
          WHERE layklar.learningCenterId = markaz.id
        )`),
              'numberOfLikes',
            ],
          ],
        },
        where: whereCondition,
        order: [[sortBy, order]],
        limit,
        offset,
      });

      centerLogger.log('info', 'get qilindi');

      res.status(200).send({
        total: learningCenters.count.length,
        page,
        limit,
        data: learningCenters.rows,
      });
    } catch (error) {
      centerLogger.log('error', 'internal server error');

      res.status(500).send({
        message: 'Error fetching Learning Centers',
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /learning-centers/{id}:
 *   get:
 *     summary: Get a specific learning center by ID
 *     tags: [Learning Centers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the learning center to retrieve
 *     responses:
 *       200:
 *         description: Learning center details
 *       404:
 *         description: Learning center not found
 *       500:
 *         description: Internal server error
 */
route.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const learningCenter = await LearningCenter.findByPk(id, {
      include: [
        { model: Branch, attributes: ['id', 'name', 'address'] },
        { model: Region, attributes: ['name'] },
        {
          model: Users,
          as: 'registeredUser',
          attributes: ['id', 'firstName', 'lastName'],
          through: { attributes: [] },
        },
        { model: Like, attributes: ['id', 'learningCenterId', 'userId'] },
        { model: Subject, as: 'subjects', through: { attributes: [] } },
        { model: Comments },
        // { model: Profession, as: 'professionlar' },
      ],
      attributes: {
        include: [
          [
            Sequelize.literal(`(
          SELECT COUNT(*) 
          FROM layklar 
          WHERE layklar.learningCenterId
        )`),
            'numberOfLikes',
          ],
        ],
      },
    });

    if (!learningCenter) {
      return res.status(404).json({ message: 'Learning Center not found' });
    }

    res.status(200).send({ message: 'Learning center', data: learningCenter });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: 'Error fetching Learning Center',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /learning-centers/{id}:
 *   patch:
 *     summary: Update a Learning Center by ID
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
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               img:
 *                 type: string
 *               regionId:
 *                 type: integer
 *               address:
 *                 type: string
 *
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
    let { error } = learningCenterValidationPatch.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }
    try {
      const { regionId } = req.body;
      const region = await Region.findByPk(regionId);

      if (!region) {
        centerLogger.log('warn', 'region not found');
        return res.status(404).json({ message: 'Region not found' });
      }
      let { name } = req.body;
      const learningCenter = await LearningCenter.findByPk(req.params.id);
      let learningCenterExists = await LearningCenter.findOne({
        where: { name },
      });
      if (learningCenterExists) {
        return res.status(400).send({ message: 'center already exists' });
      }
      if (!learningCenter) {
        centerLogger.log('warn', 'center not found');

        return res.status(404).send({ message: 'Learning Center not found' });
      }
      await learningCenter.update(req.body);
      centerLogger.log('info', 'patch qilindi');

      res
        .status(200)
        .send({ message: 'Learning Center updated', data: learningCenter });
    } catch (error) {
      centerLogger.log('error', 'internal server error');

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

    if (!learningCenter) {
      centerLogger.log('warn', 'center not found');

      return res.status(404).send({ message: 'Learning Center not found' });
    }
    centerLogger.log('info', 'deleted');

    await learningCenter.destroy();
    res.status(200).send(learningCenter);
  } catch (error) {
    centerLogger.log('error', 'internal server error');

    res.status(500).send({
      message: 'Error deleting Learning Center',
      error: error.message,
    });
  }
});

module.exports = route;
