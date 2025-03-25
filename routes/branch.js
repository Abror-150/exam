const express = require('express');
const route = express.Router();
const Branch = require('../models/branches');
const {
  branchesValidation,
  validateBranchUpdate,
} = require('../validations/branches');
const LearningCenter = require('../models/learningCenter');
const Region = require('../models/regions');
const roleAuthMiddleware = require('../middlewares/roleAuth');
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
 *     summary: Barcha filiallarni olish
 *     tags: [Branches]
 *     responses:
 *       200:
 *         description: Filiallar ro‘yxati
 */

route.get('/', async (req, res) => {
  try {
    const branches = await Branch.findAll({
      include: [{ model: LearningCenter }, { model: Region }],
    });
    res.send(branches);
  } catch (error) {
    console.log('error', error);

    res.status(500).send({ error: 'Serverda xatolik yuz berdi' });
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
// route.get('/:id', async (req, res) => {
//   try {
//     const branch = await Branch.findByPk(req.params.id, {
//       include: [{ model: Region }, { model: LearningCenter }],
//     });
//     if (!branch) return res.status(404).send({ message: 'Branch not found' });
//     res.send(branch);
//   } catch (error) {
//     res.status(500).send({ error: 'Serverda xatolik yuz berdi' });
//   }
// });

/**
 * @swagger
 * /branches:
 *   post:
 *     summary: Yangi filial qo‘shish
 *     tags: [Branches]
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
 *       201:
 *         description: Yangi filial yaratildi
 */
route.post('/', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  let { error } = branchesValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const { name, phone, img, regionId, address, learningCenterId } = req.body;
    const newBranch = await Branch.create({
      name,
      phone,
      img,
      regionId,
      address,
      learningCenterId,
    });
    res.status(201).send(newBranch);
  } catch (error) {
    console.log('error', error);

    res.status(500).send({ error: 'Serverda xatolik yuz berdi' });
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
 *                 type: string
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
  const { error } = validateBranchUpdate.validateBranchUpdate(req.body);
  if (error) {
    return res.status(400).send({ error: error.details[0].message });
  }
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).send({ message: 'Branch not found' });

    await branch.update(req.body);
    res.send(branch);
  } catch (error) {
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
    if (!branch) return res.status(404).send({ message: 'Branch not found' });

    await branch.destroy();
    res.send({ message: "Filial o'chirildi" });
  } catch (error) {
    res.status(500).send({ error: 'Serverda xatolik yuz berdi' });
  }
});

module.exports = route;
