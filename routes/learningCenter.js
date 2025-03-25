const express = require('express');
const route = express.Router();
const LearningCenter = require('../models/learningCenter');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const learningCenterValidation = require('../validations/learningCenter');
const Branch = require('../models/branches');
const Profession = require('../models/professions');
const Comments = require('../models/comment');
const Region = require('../models/regions');
/**
 * @swagger
 * /learning-centers:
 *   post:
 *     summary: Create a new Learning Center
 *     security:
 *       - BearerAuth: []
 *     tags: [Learning Centers]
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
 *               - regionId
 *               - address
 *               - branchNumber
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
 *               branchNumber:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Learning Center created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/LearningCenter'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized (token missing or invalid)
 *       403:
 *         description: Forbidden (role not allowed)
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     LearningCenter:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         img:
 *           type: string
 *         regionId:
 *           type: integer
 *         address:
 *           type: string
 *         branchNumber:
 *           type: integer
 *         userId:
 *           type: integer
 */
route.post('/', roleAuthMiddleware(['ADMIN', 'CEO']), async (req, res) => {
  let { error } = learningCenterValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    const { name, phone, ...rest } = req.body;

    const userId = req?.userId;

    const learningCenter = await LearningCenter.create({
      ...rest,
      userId,
      name,
      phone,
    });

    res
      .status(201)
      .send({ message: 'Learning Center created', data: learningCenter });
  } catch (error) {
    res.status(500).send({
      message: 'Error creating Learning Center',
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /learning-centers:
 *   get:
 *     summary: Get all Learning Centers
 *     tags: [Learning Centers]
 *     responses:
 *       200:
 *         description: List of Learning Centers
 *       500:
 *         description: Server error
 */
route.get('/', async (req, res) => {
  try {
    const learningCenters = await LearningCenter.findAll({
      include: [
        { model: Branch },
        { model: Profession },
        { model: Comments },
        { model: Region },
      ],
    });
    res.status(200).send({ data: learningCenters });
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
route.get('/:id', async (req, res) => {
  try {
    const learningCenter = await LearningCenter.findByPk(req.params.id);
    if (!learningCenter) {
      return res.status(404).send({ message: 'Learning Center not found' });
    }
    res.status(200).send({ message: 'Learning center', data: learningCenter });
  } catch (error) {
    res.status(500).send({
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
 *     security:
 *       - BearerAuth: []
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
 *     security:
 *       - BearerAuth: []
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
