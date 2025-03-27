const express = require("express");
const route = express.Router();
const { Op, where } = require("sequelize");
const { getRouteLogger } = require("../logger/logger");
const Branch = require("../models/branches");
const {
  branchesValidation,
  validateBranchUpdate,
} = require("../validations/branches");
const branchLogger = getRouteLogger(__filename);

const LearningCenter = require("../models/learningCenter");
const Region = require("../models/regions");
const roleAuthMiddleware = require("../middlewares/roleAuth");
const SubBranch = require("../models/subBranch");
const ProfessionBranch = require("../models/professionBranch");
const Subject = require("../models/subjects");
const Profession = require("../models/professions");
const Field = require("../models/fields");
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

    let order = [["createdAt", "DESC"]];
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

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Branch.findAndCountAll({
      where: whereClause,
      include: [
        { model: LearningCenter },
        { model: Region },
        { model: Profession },
      ],
      order,
      limit: parseInt(limit),
      offset,
    });
    branchLogger.log("info", "get ishladi");
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
      include: [
        { model: Region },
        { model: LearningCenter },
        { model: Profession },
      ],
    });
    if (!branch) return res.status(404).send({ message: "Branch not found" });
    branchLogger.log("info", "get id boyicha ishladi");

    res.send(branch);
  } catch (error) {
    res.status(500).send({ error: "Serverda xatolik yuz berdi" });
  }
});

/**
 * @swagger
 * paths:
 *   /branches:
 *     post:
 *       summary: "Yangi filial qo'shish"
 *       description: "Yangi filial qo'shish va u bilan bog'liq kasblar va fanlarni kiritish"
 *       tags:
 *         - Branches
 *
 *       requestBody:
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "Namuna filiali"
 *                 phone:
 *                   type: string
 *                   example: "+998901234567"
 *                 img:
 *                   type: string
 *                   example: "https://example.com/image.jpg"
 *                 regionId:
 *                   type: integer
 *                   example: 1
 *                 address:
 *                   type: string
 *                   example: "Toshkent, Chilonzor 5"
 *                 learningCenterId:
 *                   type: integer
 *                   example: 2
 *                 professionsId:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [1, 2]
 *                 subjectsId:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [4, 5]
 *       responses:
 *         201:
 *           description: "Filial muvaffaqiyatli yaratildi"
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   Branch:
 *                     type: object
 *                   branchNumber:
 *                     type: integer
 *                     example: 3
 *         400:
 *           description: "Validatsiya xatosi"
 *         500:
 *           description: "Server xatosi"
 */

route.post("/", roleAuthMiddleware(["ADMIN"]), async (req, res) => {
  let { error } = branchesValidation.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  try {
    const {
      professionsId,
      subjectsId,
      name,
      phone,
      img,
      regionId,
      address,
      learningCenterId,
    } = req.body;

    const learningCenter = await LearningCenter.findByPk(learningCenterId);
    if (!learningCenter) {
      return res.status(404).json({ error: "Edu center not found" });
    }
    const region = await Region.findByPk(regionId);
    if (!region) {
      return res.status(404).json({ error: "Region not found" });
    }
    const branchExists = await Branch.findOne({
      where: { name },
    });
    if (branchExists) {
      return res.status(409).json({ message: "Branch already exists" });
    }
    const phoneExists = await Branch.findOne({
      where: { phone },
    });
    if (phoneExists) {
      branchLogger.log("info", "phone already");
      return res.status(409).json({ message: "Phone already exists" });
    }

    const branch = await Branch.create({
      name,
      phone,
      img,
      regionId,
      address,
      learningCenterId,
    });
    branchLogger.log("info", "post qilindi");

    const count = await Branch.count({ where: { learningCenterId } });
    await LearningCenter.update(
      { branchNumber: count },
      { where: { id: learningCenterId } }
    );
    if (professionsId && professionsId.length > 0) {
      const validProfessions = await Profession.findAll({
        where: { id: professionsId },
      });

      if (validProfessions.length !== professionsId.length) {
        return res
          .status(404)
          .json({ message: "Some profession IDs are incorrect or not found!" });
      }

      const professionData = professionsId.map((id) => ({
        professionId: id,
        branchId: branch.id,
      }));

      await ProfessionBranch.bulkCreate(professionData);
    }

    if (subjectsId && subjectsId.length > 0) {
      const validSubjects = await Subject.findAll({
        where: { id: subjectsId },
      });

      if (validSubjects.length !== subjectsId.length) {
        return res
          .status(404)
          .json({ message: "Some subject IDs are incorrect or not found!" });
      }

      const subjectData = subjectsId.map((id) => ({
        subjectId: id,
        branchId: branch.id,
      }));
      await SubBranch.bulkCreate(subjectData);
    }
    res.status(201).send({ branch, branchNumber: count });
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
  const { error } = validateBranchUpdate(req.body);
  if (error) {
    return res.status(400).send({ error: error.details[0].message });
  }
  try {
    const branch = await Branch.findByPk(req.params.id);
    if (!branch) return res.status(404).send({ message: "Branch not found" });

    await branch.update(req.body);
    branchLogger.log("info", "patch ishladi");

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

    branchLogger.log("info", "delete ishladi");

    res.send(branch);
  } catch (error) {
    res.status(500).send({ error: "Serverda xatolik yuz berdi" });
  }
});

module.exports = route;
