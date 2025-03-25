const { Router } = require("express");
const Like = require("../models/likes");
const { Op } = require("sequelize");
const route = Router();
const roleAuthMiddleware = require("../middlewares/roleAuth");
const LikeValidate = require("../validations/likes");

/**
 * @swagger
 * /likes:
 *   post:
 *     summary: Like qo‘shish
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               learningCenterId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Like muvaffaqiyatli qo‘shildi
 *       400:
 *         description: Noto‘g‘ri ma‘lumot
 */
route.post("/", roleAuthMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const { error } = likeSchema.validate(req.body);
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
 * /likes/{id}:
 *   delete:
 *     summary: Like o‘chirish
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Like ID
 *     responses:
 *       200:
 *         description: Like muvaffaqiyatli o‘chirildi
 *       404:
 *         description: Like topilmadi
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
