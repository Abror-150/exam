const { Router } = require("express");
const Profession = require("../models/professions");
const { Op } = require("sequelize");
const route = Router();
const roleAuthMiddleware = require("../middlewares/auth");

/**
 * @swagger
 * /professions:
 *   get:
 *     summary: Kasblarni olish
 *     tags: [Professions]
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
 *         description: Bir sahifadagi yozuvlar soni
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Kasb nomi bo‘yicha filterlash
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Saralash maydoni (masalan, id, name)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Saralash tartibi (ASC yoki DESC)
 *     responses:
 *       200:
 *         description: Kasblar ro‘yxati
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

    let data = await Profession.findAll({
      where: whereClause,
      order: [[sortBy, order.toUpperCase()]],
      limit: limit,
      offset: (page - 1) * limit,
    });

    res.send(data);
  } catch (error) {
    res.send(error);
    console.log(error);
  }
});
/**
 * @swagger
 * /professions/{id}:
 *   get:
 *     summary: Bitta kasbni olish
 *     tags: [Professions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kasb IDsi
 *     responses:
 *       200:
 *         description: Kasb ma'lumotlari
 */
route.get("/:id", async (req, res) => {
  try {
    let id = await Profession.findByPk(req.params.id);
    res.send(id);
  } catch (error) {
    res.send(error);
    console.log(error);
  }
});

/**
 * @swagger
 * /professions:
 *   post:
 *     summary: Yangi kasb qo‘shish
 *     tags: [Professions]
 *     security:
 *       - bearerAuth: []
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
 *         description: Kasb muvaffaqiyatli qo‘shildi
 */
route.post("/", roleAuthMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const { error } = professionSchema.validate(req.body);
    if (error) {
      return res.status(400).send({ error: error.details[0].message });
    }
    const { userId } = req.user.id;
    const { learningCenterId } = req.body;

    const one = await Like.create({ userId, learningCenterId });
    res.status(201).send(one);
  } catch (error) {
    res
      .status(400)
      .send({ error: "Ma'lumot noto'g'ri", details: error.message });
    console.log(error);
  }
});

/**
 * @swagger
 * /professions/{id}:
 *   patch:
 *     summary: Kasb ma'lumotlarini yangilash
 *     tags: [Professions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kasb IDsi
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
 *         description: Kasb muvaffaqiyatli yangilandi
 */
route.patch(
  "/:id",
  roleAuthMiddleware(["ADMIN", "SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const { error } = professionSchema.validate(req.body);
      if (error) {
        return res.status(400).send({ error: error.details[0].message });
      }
      const { id } = req.params;
      const one = await Profession.findByPk(id);
      await one.update(req.body);
      res.json(one);
    } catch (error) {
      res.status(500).json({ error: "Server xatosi" });
      console.log(error);
    }
  }
);

/**
 * @swagger
 * /professions/{id}:
 *   delete:
 *     summary: Kasbni o‘chirish
 *     tags: [Professions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Kasb IDsi
 *     responses:
 *       200:
 *         description: Kasb muvaffaqiyatli o‘chirildi
 */
route.delete("/:id", roleAuthMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Like.destroy({ where: { id } });
    if (deleted) {
      return res.send({ message: "Like o‘chirildi" });
    }
    res.status(404).send({ error: "Like bosmagan" });
  } catch (error) {
    res.status(500).send({ error: "Server xatosi", details: error.message });
  }
});

module.exports = route;
