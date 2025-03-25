const express = require('express');
const router = express.Router();
const LearningCenter = require('../models/learningCenter');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const learningCenterValidation = require('../validations/learningCenter');
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
 *
 *     responses:
 *       201:
 *         description: Learning Center created
 *       500:
 *         description: Server error
 */
router.post(
  '/',

  roleAuthMiddleware(['ADMIN', 'CEO']),
  async (req, res) => {
    let { error } = learningCenterValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    try {
      const { name, phone, ...rest } = req.body;
      const userId = req?.userId;
      console.log(userId);

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
  }
);

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
router.get('/', async (req, res) => {
  try {
    const learningCenters = await LearningCenter.findAll();
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
router.get('/:id', async (req, res) => {
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
router.patch(
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
router.delete(
  '/:id',
  roleAuthMiddleware(['ADMIN', 'CEO']),
  async (req, res) => {
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
  }
);

module.exports = router;
