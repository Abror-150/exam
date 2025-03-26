const express = require("express");
const route = express.Router();
const ResourceCategory = require("../models/resourceCategory");
const roleAuthMiddleware = require("../middlewares/roleAuth");
const Resource = require("../models/resource");

/**
 * @swagger
 * /resource-categories:
 *   post:
 *     summary: Yangi ResourceCategory qo‘shish
 *     tags: [ResourceCategories]
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
 *               img:
 *                 type: string
 *     responses:
 *       201:
 *         description: ResourceCategory muvaffaqiyatli qo‘shildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ResourceCategory'
 *       401:
 *         description: Token yo‘q yoki noto‘g‘ri
 *       403:
 *         description: Ruxsat yo‘q (ADMIN yoki CEO emas)
 *       500:
 *         description: Server xatosi
 */
route.post("/", roleAuthMiddleware(["ADMIN", "CEO"]), async (req, res) => {
  try {
    const { name, img } = req.body;
    const existingCategory = await ResourceCategory.findOne({
      where: { name },
    });

    if (existingCategory) {
      return res.status(400).json({ message: "This category already exists" });
    }

    const resourceCategory = await ResourceCategory.create({
      name,
      img,
    });

    res.status(201).json({
      message: "ResourceCategory added",
      data: resourceCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "ResourceCategory qo'shishda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resource-categories:
 *   get:
 *     summary: Barcha ResourceCategory’larni olish (filter, sort, pagination bilan)
 *     tags: [ResourceCategories]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: ResourceCategory nomi bo‘yicha filter
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, name]
 *         description: Sort qilish maydoni (createdAt yoki name)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort qilish tartibi (ASC yoki DESC)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Sahifa raqami (Pagination uchun)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Har bir sahifadagi elementlar soni (Pagination uchun)
 *     responses:
 *       200:
 *         description: Barcha ResourceCategory ro‘yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Barcha ResourceCategorylar"
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResourceCategory'
 *       500:
 *         description: Server xatosi
 */

route.get("/", async (req, res) => {
  try {
    let {
      name, // search alohida qilib olindi
      sortBy = "createdAt",
      order = "DESC",
      page = 1,
      limit = 10,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const offset = (page - 1) * limit;

    const whereCondition = {};
    if (name) {
      whereCondition.name = { [Op.iLike]: `%${name}%` };
    }

    const resourceCategories = await ResourceCategory.findAndCountAll({
      where: whereCondition,
      include: [{ model: Resource }],
      order: [[sortBy, order]],
      limit,
      offset,
    });

    res.json({
      message: "Barcha ResourceCategorylar",
      page,
      limit,
      total: resourceCategories.count,
      data: resourceCategories.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "ResourceCategory'larni olishda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resource-categories/{id}:
 *   get:
 *     summary: Bitta ResourceCategory’ni ID bo‘yicha olish
 *     tags: [ResourceCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ResourceCategory ID
 *     responses:
 *       200:
 *         description: ResourceCategory topildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ResourceCategory'
 *       404:
 *         description: ResourceCategory topilmadi
 *       500:
 *         description: Server xatosi
 */
route.get("/:id", async (req, res) => {
  try {
    const resourceCategory = await ResourceCategory.findByPk(req.params.id, {
      include: [{ model: Resource }],
    });
    if (!resourceCategory) {
      return res.status(404).json({ message: "ResourceCategory not found" });
    }
    res.json({
      message: "ResourceCategory topildi",
      data: resourceCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "ResourceCategory olishda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resource-categories/{id}:
 *   patch:
 *     summary: ResourceCategory’ni yangilash
 *     tags: [ResourceCategories]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ResourceCategory ID
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
 *         description: ResourceCategory yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ResourceCategory'
 *       404:
 *         description: ResourceCategory topilmadi
 *       401:
 *         description: Token yo‘q yoki noto‘g‘ri
 *       403:
 *         description: Ruxsat yo‘q (ADMIN yoki CEO emas)
 *       500:
 *         description: Server xatosi
 */
route.patch("/:id", roleAuthMiddleware(["ADMIN", "CEO"]), async (req, res) => {
  try {
    const resourceCategory = await ResourceCategory.findByPk(req.params.id);
    if (!resourceCategory) {
      return res.status(404).json({ message: "ResourceCategory topilmadi" });
    }

    await resourceCategory.update(req.body);

    res.json({
      message: "ResourceCategory yangilandi",
      data: resourceCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "ResourceCategory yangilashda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resource-categories/{id}:
 *   delete:
 *     summary: ResourceCategory’ni o‘chirish
 *     tags: [ResourceCategories]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ResourceCategory ID
 *     responses:
 *       200:
 *         description: ResourceCategory o‘chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: ResourceCategory topilmadi
 *       401:
 *         description: Token yo‘q yoki noto‘g‘ri
 *       403:
 *         description: Ruxsat yo‘q (ADMIN yoki CEO emas)
 *       500:
 *         description: Server xatosi
 */
route.delete("/:id", roleAuthMiddleware(["ADMIN", "CEO"]), async (req, res) => {
  try {
    const resourceCategory = await ResourceCategory.findByPk(req.params.id);
    if (!resourceCategory) {
      return res.status(404).json({ message: "ResourceCategory topilmadi" });
    }

    await resourceCategory.destroy();
    res.json({ message: "ResourceCategory deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "ResourceCategory o'chirishda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     ResourceCategory:
 *       type: object
 *       required:
 *         - name
 *         - img
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         img:
 *           type: string
 */

module.exports = route;
