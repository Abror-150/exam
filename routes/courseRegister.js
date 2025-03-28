const express = require("express");
const CourseRegister = require("../models/courseRegister");
const Users = require("../models/user");
const roleAuthMiddleware = require("../middlewares/roleAuth");
const LearningCenter = require("../models/learningCenter");
const {
  CourseRegistervalidation,
  CourseRegistervalidationPatch,
} = require("../validations/courseRegister");
const Branch = require("../models/branches");
const route = express.Router();
const { getRouteLogger } = require("../logger/logger");

const courseRegisterLogger = getRouteLogger(__filename);
/**
 * @swagger
 * /course-register:
 *   post:
 *     summary: Foydalanuvchini kursga ro'yxatdan o'tkazish
 *     tags: [Course Register]

 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - learningCenterId
 *             properties:
 *               learningCenterId:
 *                 type: integer
 *                 example: 1
 *               branchId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Ro'yxatdan o'tish muvaffaqiyatli yaratildi
 *       404:
 *         description: User yoki Learning Center topilmadi
 *       500:
 *         description: Server xatosi
 */
route.post("/", roleAuthMiddleware(["USER", "ADMIN"]), async (req, res) => {
  let { error } = CourseRegistervalidation.validate(req.body);
  if (error) {
    courseRegisterLogger.log("warn", "validation error");
    return res.status(400).send({ error: error.details[0].message });
  }
  try {
    const { learningCenterId, branchId } = req.body;
    const userId = req.userId;

    const user = await Users.findByPk(userId);
    const learningCenter = await LearningCenter.findByPk(learningCenterId);
    const branch = await Branch.findByPk(branchId);

    if (!user) {
      courseRegisterLogger.log("warn", "user not found");

      return res.status(404).json({ message: "User  not found" });
    }
    if (!branch) {
      courseRegisterLogger.log("warn", "branch not found");
      return res.status(404).json({ message: "Branch not found" });
    }
    if (!learningCenter) {
      courseRegisterLogger.log("warn", "learning center  not found");

      return res.status(404).json({ message: "edu center  not found" });
    }

    const existingRegistration = await CourseRegister.findOne({
      where: { userId, learningCenterId },
    });

    if (existingRegistration) {
      courseRegisterLogger.log("warn", "already center user");

      return res.status(400).json({
        message: "User is already registered in this learning center",
      });
    }

    const registration = await CourseRegister.create({
      userId,
      learningCenterId,
      branchId,
    });
    courseRegisterLogger.log("info", "post qilindi");

    res.status(201).json(registration);
  } catch (error) {
    courseRegisterLogger.log("error", "internal server error");

    console.error("Xatolik:", error);
    res.status(500).json({ message: "Server xatosi", error: error.message });
  }
});

/**
 * @swagger
 * /course-register:
 *   get:
 *     summary: Barcha ro'yxatdan o'tganlarni olish
 *     tags: [Course Register]
 *     responses:
 *       200:
 *         description: Ro'yxatdan o'tganlar ro'yxati
 *       500:
 *         description: Server xatosi
 */
route.get("/", roleAuthMiddleware(["ADMIN"]), async (req, res) => {
  try {
    const registrations = await CourseRegister.findAll({
      include: [{ model: Users }],
    });
    courseRegisterLogger.log("info", "get qilindi");

    res.status(200).json(registrations);
  } catch (error) {
    courseRegisterLogger.log("warn", "internal server error");

    res.status(500).json({ message: "Server xatosi" });
  }
});

/**
 * @swagger
 * /course-register/{id}:
 *   patch:
 *     summary: Ro'yxatdan o'tishni yangilash
 *     tags: [Course Register]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               learningCenterId:
 *                 type: integer
 *               branchId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ro'yxatdan o'tish muvaffaqiyatli yangilandi
 *       404:
 *         description: Register topilmadi
 *       500:
 *         description: Server xatosi
 */
route.patch(
  "/:id",
  roleAuthMiddleware(["USER", "ADMIN", "SUPER_ADMIN"]),
  async (req, res) => {
    let { error } = CourseRegistervalidationPatch.validate(req.body);
    if (error) {
      courseRegisterLogger.log("warn", "validation error");
      return res.status(400).send({ error: error.details[0].message });
    }
    try {
      const { id } = req.params;
      const userId = req.userId;
      const { learningCenterId, branchId } = req.body;
      const learningCenter = await LearningCenter.findByPk(learningCenterId);
      if (!learningCenter) {
        return res.status(404).send({ message: "learningCenter not found" });
      }
      const branch = await Branch.findByPk(branchId);

      if (!branch) {
        return res.status(404).send({ message: "branch not found" });
      }
      const registration = await CourseRegister.findByPk(id);
      if (!registration) {
        courseRegisterLogger.log("warn", "register not found");

        return res.status(404).json({ message: "Register not found" });
      }
      courseRegisterLogger.log("info", "patch  qilindi");

      await registration.update({ userId, learningCenterId, branchId });
      res.status(200).json(registration);
    } catch (error) {
      courseRegisterLogger.log("error", "internal server error");

      console.error(error);
      res.status(500).json({ message: "Server xatosi" });
    }
  }
);

/**
 * @swagger
 * /course-register/{id}:
 *   delete:
 *     summary: Ro'yxatdan o'tishni o'chirish
 *     tags: [Course Register]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ro'yxatdan o'tish o'chirildi
 *       404:
 *         description: Register topilmadi
 *       500:
 *         description: Server xatosi
 */
route.delete(
  "/:id",
  roleAuthMiddleware(["USER", "ADMIN"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const registration = await CourseRegister.findByPk(id);

      if (!registration) {
        courseRegisterLogger.log("warn", "register not found");

        return res.status(404).json({ message: "Register not found" });
      }
      courseRegisterLogger.log("info", "deleted");

      await registration.destroy();
      res.status(200).json({ message: "Ro'yxatdan o'tish o'chirildi" });
    } catch (error) {
      courseRegisterLogger.log("error", "internal server error");

      console.error(error);
      res.status(500).json({ message: "Server xatosi" });
    }
  }
);

module.exports = route;
