const { Router } = require("express");
const { Op } = require("sequelize");
const route = Router();
const Profession = require("../models/professions");
const roleAuthMiddleware = require("../middlewares/roleAuth");
const { subjectSchema } = require("../validations/subjects");
const Subject = require("../models/subjects");
const LearningCenter = require("../models/learningCenter");
/**
 * @swagger
 * tags:
 *   name: Subjects
 *   description: Fanlar boshqaruvi
 */

/**
 * @swagger
 * /subjects:
 *   get:
 *     summary: Barcha fanlarni olish
 *     tags: [Subjects]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Sahifa raqami
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Sahifadagi elementlar soni
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Fan nomi bo‘yicha qidirish
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, name]
 *         description: Qaysi ustun bo‘yicha saralash (id yoki name)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Saralash tartibi
 *     responses:
 *       200:
 *         description: Fanlar ro‘yxati
 *       500:
 *         description: Server xatosi
 */
route.get("/", async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      sortBy = "id",
      order = "ASC",
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
        {
          model: LearningCenter,

          through: { attributes: [] },
        },
      ],
    });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Server xatosi", details: error.message });
  }
});

/**
 * @swagger
 * /subjects/{id}:
 *   get:
 *     summary: ID bo‘yicha bitta fan olish
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Fan ID si
 *     responses:
 *       200:
 *         description: Fan topildi
 *       404:
 *         description: Fan topilmadi
 */
route.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const oneId = await Subject.findByPk(id, {
      include: [
        {
          model: LearningCenter,
          as: "markazlar",
          through: { attributes: [] },
        },
      ],
    });
    if (!oneId) {
      return res.status(404).json({ error: "subject topilmadi" });
    }

    res.json(oneId);
  } catch (error) {
    res.status(500).json({ error: "Server xatosi", details: error.message });
  }
});

/**
 * @swagger
 * /subjects:
 *   post:
 *     summary: Yangi fan yaratish
 *     tags: [Subjects]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               img:
 *                 type: string
 *     responses:
 *       201:
 *         description: Fan yaratildi
 *       400:
 *         description: Xato ma'lumot kiritildi
 */
route.post("/", async (req, res) => {
  const { error } = subjectSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const { name, img } = req.body;
    const existingSubject = await Subject.findOne({
      where: { name },
    });

    if (existingSubject) {
      return res.status(400).json({ message: "This subject already exists" });
    }

    const one = await Subject.create({ name, img });
    res.status(201).json(one);
  } catch (error) {
    console.log(error);

    res.status(500).json({ error: "Server xatosi", details: error.message });
  }
});

/**
 * @swagger
 * /subjects/{id}:
 *   patch:
 *     summary: Fan ma'lumotlarini yangilash
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Fan ID si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               img:
 *                 type: string
 *     responses:
 *       200:
 *         description: Fan yangilandi
 *       400:
 *         description: Xato ma'lumot kiritildi
 *       404:
 *         description: Fan topilmadi
 */

route.patch(
  "/:id",
  roleAuthMiddleware(["ADMIN", "SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const one = await Subject.findByPk(id);
      if (!one) {
        return res.status(404).send({ error: "subject not found" });
      }
      await one.update(req.body);
      res.json(one);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi", details: error.message });
    }
  }
);
/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     summary: Fan o‘chirish
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Fan ID si
 *     responses:
 *       200:
 *         description: Fan o‘chirildi
 *       404:
 *         description: Fan topilmadi
 */

route.delete("/:id", roleAuthMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Subject.destroy({ where: { id } });
    if (deleted) {
      return res.send({ message: "subject o'chirildi", deleted });
    }
    res.status(404).send({ error: "subject topilmadi" });
  } catch (error) {
    res.status(500).send({ error: "Server xatosi", details: error.message });
  }
});

module.exports = route;
