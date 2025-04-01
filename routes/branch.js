const express = require('express');
const route = express.Router();
const { Op, where } = require('sequelize');
const Branch = require('../models/branches');
const {
  branchesValidation,
  branchesValidationPatch,
} = require('../validations/branches');
const { getRouteLogger } = require('../logger/logger');
const branchLogger = getRouteLogger(__filename);

const LearningCenter = require('../models/learningCenter');
const Region = require('../models/regions');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const SubBranch = require('../models/subBranch');
const ProfessionBranch = require('../models/professionBranch');
const Subject = require('../models/subjects');
const Profession = require('../models/professions');
const Field = require('../models/fields');
/**
 * @swagger
 * tags:
 *   - name: Branches
 *     description: Filiallar bilan ishlash
 */

/**
 * @swagger
 * /branches:
 *   get:
 *     summary: Barcha filiallarni olish (Filtr, Sort, Pagination bilan)
 *     tags: [Branches]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filial nomi bo‘yicha filtr
 *       - in: query
 *         name: regionId
 *         schema:
 *           type: integer
 *         description: Hudud ID bo‘yicha filtr
 *       - in: query
 *         name: learningCenterId
 *         schema:
 *           type: integer
 *         description: O‘quv markazi ID bo‘yicha filtr
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, regionId, learningCenterId]
 *         description: Saralash (name, createdAt, regionId, learningCenterId)
 *       - in: query
 *         name: orderDirection
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Saralash tartibi (ASC yoki DESC)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Sahifalash (Nechinchi sahifa)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Sahifalash (Bir sahifada nechta)
 *     responses:
 *       200:
 *         description: Filiallar ro‘yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
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
 *                         example: "Filial 1"
 *                       regionId:
 *                         type: integer
 *                         example: 2
 *                       learningCenterId:
 *                         type: integer
 *                         example: 3
 *       500:
 *         description: Server xatosi
 */

route.get('/', async (req, res) => {
  try {
    const {
      name,
      regionId,
      learningCenterId,
      orderBy,
      orderDirection,
      page = 1,
      limit = 10,
    } = req.query;

    let whereClause = {};
    if (name) whereClause.name = { [Op.like]: `%${name}%` };
    if (regionId) whereClause.regionId = regionId;
    if (learningCenterId) whereClause.learningCenterId = learningCenterId;

    let order = [['createdAt', 'DESC']];
    if (orderBy) {
      order = [
        [
          orderBy,
          orderDirection && orderDirection.toUpperCase() === 'ASC'
            ? 'ASC'
            : 'DESC',
        ],
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Branch.findAndCountAll({
      where: whereClause,
      include: [
        { model: LearningCenter },
        { model: Region },
        { model: Profession, through: { attributes: [] } },
        { model: Subject, as: 'subjectslar', through: { attributes: [] } },
      ],
      order,
      limit: parseInt(limit),
      offset,
    });
    branchLogger.log('info', 'get ishladi');
    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      data: rows,
    });
  } catch (error) {
    console.error('error', error);
    res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
});

/**
 * @swagger
 * /branches/{id}:
 *   get:
 *     summary: Bitta filialni ID bo‘yicha olish
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Filial ID si
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Filial ma’lumotlari
 *       404:
 *         description: Filial topilmadi
 */

route.get('/:id', async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id, {
      include: [
        { model: Region },
        { model: LearningCenter },
        { model: Profession },
      ],
    });
    if (!branch) return res.status(404).send({ message: 'Branch not found' });

    branchLogger.log('info', 'get id boyicha ishladi');

    res.send(branch);
  } catch (error) {
    res.status(500).send({ error: 'Serverda xatolik yuz berdi' });
  }
});

/**
 * @swagger
 * /branches:
 *   post:
 *     summary: Create a new branch
 *     tags:
 *       - Branches
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
 *               - learningCenterId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Central Branch"
 *               phone:
 *                 type: string
 *                 example: "+998901234567"
 *               img:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               regionId:
 *                 type: integer
 *                 example: 1
 *               address:
 *                 type: string
 *                 example: "123 Main St, Tashkent"
 *               learningCenterId:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: Branch created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 branch:
 *                   type: object
 *                   example:
 *                     id: 1
 *                     name: "Central Branch"
 *                     phone: "+998901234567"
 *                     img: "https://example.com/image.jpg"
 *                     regionId: 1
 *                     address: "123 Main St, Tashkent"
 *                     learningCenterId: 2
 *                 branchNumber:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Invalid request format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation error message"
 *       404:
 *         description: Learning center or region not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Edu center not found"
 *       409:
 *         description: Duplicate branch or phone number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Branch already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */

route.post('/', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  let { error } = branchesValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    const { name, phone, img, regionId, address, learningCenterId } = req.body;

    const learningCenter = await LearningCenter.findByPk(learningCenterId);
    if (!learningCenter) {
      return res.status(404).json({ error: 'Edu center not found' });
    }

    const region = await Region.findByPk(regionId);
    if (!region) {
      return res.status(404).json({ error: 'Region not found' });
    }

    const branchExists = await Branch.findOne({ where: { name } });
    if (branchExists) {
      return res.status(409).json({ message: 'Branch already exists' });
    }

    const phoneExists = await Branch.findOne({ where: { phone } });
    if (phoneExists) {
      return res.status(409).json({ message: 'Phone already exists' });
    }

    const branch = await Branch.create({
      name,
      phone,
      img,
      regionId,
      address,
      learningCenterId,
    });

    const count = await Branch.count({ where: { learningCenterId } });
    await LearningCenter.update(
      { branchNumber: count },
      { where: { id: learningCenterId } }
    );

    res.status(201).json({ branch, branchNumber: count });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /branches/subjects:
 *   post:
 *     summary: "Link professions to a branch"
 *     description: "Berilgan `branchId` uchun subjects qo‘shadi."
 *     tags:
 *       - "Branches"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branchId:
 *                 type: integer
 *                 example: 5
 *               subjectId:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *     responses:
 *       201:
 *         description: "Subjects linked successfully!"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Subjects linked successfully!"
 *       400:
 *         description: "Invalid request body!"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "branchId and subjectId are required and must be valid!"
 *       404:
 *         description: "Branch or Subject not found!"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Branch not found!"
 *       500:
 *         description: "Serverda xatolik yuz berdi"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Serverda xatolik yuz berdi"
 */

route.post('/subjects', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { branchId, subjectId } = req.body;

    if (!branchId || !Array.isArray(subjectId) || subjectId.length === 0) {
      return res.status(400).json({
        message: 'branchId and subjectId are required and must be valid!',
      });
    }

    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found!' });
    }

    const validSubjects = await Subject.findAll({ where: { id: subjectId } });
    if (validSubjects.length !== subjectId.length) {
      return res
        .status(404)
        .json({ message: 'Some subject IDs are incorrect!' });
    }

    const existingRelations = await SubBranch.findAll({
      where: {
        branchId,
        subjectId,
      },
    });

    const existingIds = existingRelations.map((rel) => rel.subjectId);

    const newSubjects = subjectId.filter((id) => !existingIds.includes(id));
    if (newSubjects.length === 0) {
      return res
        .status(409)
        .json({ message: 'All subjects are already created' });
    }
    if (newSubjects.length > 0) {
      const subjectData = newSubjects.map((id) => ({
        subjectId: id,
        branchId,
      }));
      await SubBranch.bulkCreate(subjectData);
    }

    res.status(201).json({ message: 'Subjects creadet successfully!' });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
});

/**
 * @swagger
 * /branches/professions:
 *   post:
 *     summary: Link professions to a branch
 *     tags:
 *       - Branches
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branchId
 *               - professionId
 *             properties:
 *               branchId:
 *                 type: integer
 *                 example: 1
 *               professionId:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2, 3, 4]
 *     responses:
 *       201:
 *         description: Professions linked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Professions linked successfully!"
 *       400:
 *         description: Invalid request format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "branchId and professionId are required and must be in a valid format!"
 *       404:
 *         description: Branch or profession IDs not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Some profession IDs are incorrect or not found!"
 *       409:
 *         description: All professions are already linked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All professions are already linked"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Serverda xatolik yuz berdi"
 */

route.post('/professions', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { branchId, professionId } = req.body;

    if (
      !branchId ||
      !Array.isArray(professionId) ||
      professionId.length === 0
    ) {
      return res.status(400).json({
        message:
          'branchId and professionId are required and must be in a valid format!',
      });
    }

    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found!' });
    }

    const validProfessions = await Profession.findAll({
      where: { id: professionId },
    });

    if (validProfessions.length !== professionId.length) {
      return res.status(404).json({
        message: 'Some profession IDs are incorrect or not found!',
      });
    }

    const existingProfessions = await ProfessionBranch.findAll({
      where: {
        branchId,
        professionId,
      },
    });

    const existingIds = existingProfessions.map((p) => p.professionId);
    const newProfessions = professionId.filter(
      (id) => !existingIds.includes(id)
    );

    if (newProfessions.length === 0) {
      return res
        .status(409)
        .json({ message: 'All professions are already created' });
    }

    const professionData = newProfessions.map((id) => ({
      professionId: id,
      branchId,
    }));

    await ProfessionBranch.bulkCreate(professionData);

    res.status(201).json({ message: 'Profesions created ' });
  } catch (error) {
    console.log('Error:', error);
    res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
  }
});

/**
 * @swagger
 * /branches/{id}:
 *   patch:
 *     summary: Filialni yangilash
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Filial ID si
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
 *               learningCenterId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Filial ma’lumotlari yangilandi
 *       404:
 *         description: Filial topilmadi
 */
route.patch('/:id', async (req, res) => {
  const { error } = branchesValidationPatch.validate(req.body);

  if (error) {
    branchLogger.log('warn', 'validation error');

    return res.status(400).send({ error: error.details[0].message });
  }
  try {
    const branch = await Branch.findByPk(req.params.id);
    let { name } = req.body;
    const branchexists = await Branch.findOne({ where: { name } });
    if (branchexists) {
      return res.status(400).send({ message: 'branch already exists' });
    }
    branchLogger.log('warn', 'region not found');
    if (!branch) return res.status(404).send({ message: 'Branch not found' });

    await branch.update(req.body);
    branchLogger.log('info', 'patch ishladi');

    res.send(branch);
  } catch (error) {
    branchLogger.log('error', 'internal server error');
    console.log(error);

    res.status(500).send({ error: 'Serverda xatolik yuz berdi' });
  }
});

/**
 * @swagger
 * /branches/{id}:
 *   delete:
 *     summary: Filialni o‘chirish
 *     tags: [Branches]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Filial ID si
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Filial o‘chirildi
 *       404:
 *         description: Filial topilmadi
 */
route.delete('/:id', async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) {
      branchLogger.log('warn', 'branch not found');
      return res.status(404).send({ message: 'Branch not found' });
    }

    await branch.destroy();
    branchLogger.log('info', 'delete ishladi');

    res.send(branch);
  } catch (error) {
    branchLogger.log('error', 'internal server error');
    res.status(500).send({ error: 'Serverda xatolik yuz berdi' });
  }
});

module.exports = route;
