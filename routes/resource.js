const express = require("express");
const route = express.Router();
const Resource = require("../models/resource");
const roleAuthMiddleware = require("../middlewares/roleAuth");
const Users = require("../models/user");
const ResourceCategory = require("../models/resourceCategory");
const logger = require("../logger/logger");

/**
 * @swagger
 * /resources:
 *   post:
 *     summary: Yangi Resource qo‘shish
 *     tags: [Resources]
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - file
 *               - img
 *               - describtion
 *               - link
 *               - categoryId
 *             properties:
 *               name:
 *                 type: string
 *               file:
 *                 type: string
 *               img:
 *                 type: string
 *               describtion:
 *                 type: string
 *               link:
 *                 type: string
 *               resourceCategoryId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Resource muvaffaqiyatli qo‘shildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       401:
 *         description: Token yo‘q yoki noto‘g‘ri
 *       403:
 *         description: Ruxsat yo‘q (ADMIN yoki CEO emas)
 *       500:
 *         description: Server xatosi
 */

route.post("/", roleAuthMiddleware(["ADMIN", "CEO"]), async (req, res) => {
  try {
    const { name, file, img, describtion, link, categoryId } = req.body;
    const categoryExists = await ResourceCategory.findByPk(categoryId);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }
    const userId = req.userId;

    const existingResource = await Resource.findOne({
      where: { name },
    });

    if (existingResource) {
      return res.status(400).json({ message: "This resource already exists" });
    }

    const category = await ResourceCategory.findByPk(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const resource = await Resource.create({
      name,
      file,
      img,
      describtion,
      link,
      userId,
      categoryId,
    });
    res.status(201).json({
      message: "Resource added",
      data: resource,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Resource qo'shishda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resources:
 *   get:
 *     summary: Barcha resourclarni olish (filter, sort, pagination bilan)
 *     tags: [Resources]
 *     parameters:
 *       - in: query
 *         name: nameSearch
 *         schema:
 *           type: string
 *         description: Resource nomi bo‘yicha qidirish
 *       - in: query
 *         name: descriptionSearch
 *         schema:
 *           type: string
 *         description: Resource tavsifi (description) bo‘yicha qidirish
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
 *         description: Barcha resourclar ro‘yxati
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "All resources"
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
 *                     $ref: '#/components/schemas/Resource'
 *       500:
 *         description: Server xatosi
 */
route.get("/", async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    let offset = (page - 1) * limit;

    const resources = await Resource.findAndCountAll({
      include: [{ model: Users }],
      limit,
      offset,
    });

    res.json({
      message: "All resources",
      page,
      limit,
      total: resources.count,
      data: resources.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Resourclarni olishda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resources/{id}:
 *   get:
 *     summary: Bitta resource’ni ID bo‘yicha olish
 *     tags: [Resources]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource topildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Resource topilmadi
 *       500:
 *         description: Server xatosi
 */
route.get("/:id", async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id, {
      include: [{ model: Users }],
    });
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.json({
      message: "Resource topildi",
      data: resource,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Resource olishda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resources/{id}:
 *   patch:
 *     summary: Resource’ni yangilash
 *     tags: [Resources]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               file:
 *                 type: string
 *               img:
 *                 type: string
 *               describtion:
 *                 type: string
 *               link:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Resource yangilandi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Resource'
 *       404:
 *         description: Resource topilmadi
 *       401:
 *         description: Token yo‘q yoki noto‘g‘ri
 *       403:
 *         description: Ruxsat yo‘q (ADMIN yoki CEO emas)
 *       500:
 *         description: Server xatosi
 */
route.patch("/:id", roleAuthMiddleware(["ADMIN", "CEO"]), async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    await resource.update(req.body);
    res.json({
      message: "Resource updated",
      data: resource,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Resource yangilashda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /resources/{id}:
 *   delete:
 *     summary: Resource’ni o‘chirish
 *     tags: [Resources]
 *
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource o‘chirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Resource topilmadi
 *       401:
 *         description: Token yo‘q yoki noto‘g‘ri
 *       403:
 *         description: Ruxsat yo‘q (ADMIN yoki CEO emas)
 *       500:
 *         description: Server xatosi
 */
route.delete("/:id", roleAuthMiddleware(["ADMIN", "CEO"]), async (req, res) => {
  try {
    const resource = await Resource.findByPk(req.params.id);
    if (!resource) {
      logger.warn(`Resource not found for deletion: ID ${req.params.id}`);
      return res.status(404).json({ message: "Resource topilmadi" });
    }

    await resource.destroy();
    res.json({ message: "Resource deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Resource o'chirishda xatolik",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Resource:
 *       type: object
 *       required:
 *         - name
 *         - file
 *         - img
 *         - describtion
 *         - link
 *
 *         - categoryId
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         file:
 *           type: string
 *         img:
 *           type: string
 *         describtion:
 *           type: string
 *         link:
 *           type: string
 *
 *         categoryId:
 *           type: integer
 */

module.exports = route;
