const { Router } = require("express");
const Like = require("../models/likes");
const { Op } = require("sequelize");
const route = Router();

const roleAuthMiddleware = require("../middlewares/roleAuth");
const { likeSchema } = require("../validations/likes");

const logger = require('../logger/logger');

/**
 * @swagger
 * /likes:
 *   post:
 *     summary: Like qo‘shish
 *     tags: [Likes]
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
    logger.info(`POST /likes - User ID: ${req.userId}`);
    console.log("User ID:", req.userId);
    if (!req.userId) {
      logger.warn("Token not provided");
      return res.status(401).json({ error: "Token not provided" });
    }

    const { error } = likeSchema.validate(req.body);
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).send({ error: error.details[0].message });
    }

    const userId = req.userId;
    const { learningCenterId } = req.body;
    const existingLike = await Like.findOne({
      where: { userId, learningCenterId },
    });

    if (existingLike) {
      logger.warn("User already liked this learning center");
      return res
        .status(400)
        .json({ message: "User already liked this learning center" });
    }

    const one = await Like.create({ userId, learningCenterId });
    logger.info(`Like added by User ID: ${userId} for Learning Center ID: ${learningCenterId}`);
    res.status(201).send(one);
  } catch (error) {
    logger.error(`Error in POST /likes: ${error.message}`);
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
    logger.info(`DELETE /likes/${id} - Request to delete like`);
    const deleted = await Like.destroy({ where: { id } });
    if (deleted) {
      logger.info(`Like ID ${id} deleted successfully`);
      return res.send({ message: "Like o'chirildi" });
    }
    logger.warn(`Like ID ${id} not found or not liked`);
    res.status(404).send({ error: "Like bosmagan" });
  } catch (error) {
    logger.error(`Error in DELETE /likes/${req.params.id}: ${error.message}`);
    res.status(500).send({ error: "Server xatosi", details: error.message });
  }
});

module.exports = route;
