const express = require("express");
const route = express.Router();
const { Op } = require("sequelize");

const Branch = require("../models/branches");
const {
  branchesValidation,
  validateBranchUpdate,
} = require("../validations/branches");
const LearningCenter = require("../models/learningCenter");
const Region = require("../models/regions");
const roleAuthMiddleware = require("../middlewares/roleAuth");
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

route.get("/", async (req, res) => {
  try {
    // Query parametrlari
    const {
      name,
      regionId,
      learningCenterId,
      orderBy,
      orderDirection,
      page = 1,
      limit = 10,
    } = req.query;

    // Filtir
    let whereClause = {};
    if (name) whereClause.name = { [Op.iLike]: `%${name}%` }; // Case-insensitive search
    if (regionId) whereClause.regionId = regionId;
    if (learningCenterId) whereClause.learningCenterId = learningCenterId;

    // Sortlash
    let order = [["createdAt", "DESC"]]; // Default createdAt DESC
    if (orderBy) {
      order = [
        [
          orderBy,
          orderDirection && orderDirection.toUpperCase() === "ASC"
            ? "ASC"
            : "DESC",
        ],
      ];
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Branch.findAndCountAll({
      where: whereClause,
      include: [{ model: LearningCenter }, { model: Region }],
      order,
      limit: parseInt(limit),
      offset,
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      data: rows,
    });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: "Serverda xatolik yuz berdi" });
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
route.get("/:id", async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id, {
      include: [{ model: Region }, { model: LearningCenter }],
    });
    if (!branch) return res.status(404).send({ message: "Branch not found" });
    res.send(branch);
  } catch (error) {
    res.status(500).send({ error: "Serverda xatolik yuz berdi" });
  }
});

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
route.post("/", roleAuthMiddleware(["ADMIN"]), async (req, res) => {
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
    console.log("error", error);

    res.status(500).send({ error: "Serverda xatolik yuz berdi" });
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
route.patch("/:id", async (req, res) => {
  const { error } = validateBranchUpdate.validateBranchUpdate(req.body);
  if (error) {
    return res.status(400).send({ error: error.details[0].message });
  }
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).send({ message: "Branch not found" });

    await branch.update(req.body);
    res.send(branch);
  } catch (error) {
    res.status(500).send({ error: "Serverda xatolik yuz berdi" });
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
route.delete("/:id", async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).send({ message: "Branch not found" });

    await branch.destroy();
    res.send({ message: "Filial o'chirildi" });
  } catch (error) {
    res.status(500).send({ error: "Serverda xatolik yuz berdi" });
  }
});

module.exports = route;
