const express = require("express");

const route = express.Router();
const LearningCenter = require("../models/learningCenter");
const learningCenterValidation = require("../validations/learningCenter");
const Branch = require("../models/branches");
const Comments = require("../models/comment");
const { Op } = require("sequelize");
const Users = require("../models/user");
const Subject = require("../models/subjects");
const SubCenter = require("../models/subCenter");
const Field = require("../models/fields");
const Like = require("../models/likes");
const { Sequelize } = require("sequelize");
const { getRouteLogger } = require("../logger/logger");
const { message } = require("../validations/regions");
const roleAuthMiddleware = require("../middlewares/roleAuth");
const Profession = require("../models/professions");
const Region = require("../models/regions");

const centerLogger = getRouteLogger(__filename);
/**
 * @swagger
 * /learning-centers:
 *   post:
 *     summary: Create a new Learning Center
 *     description: Only users with 'ADMIN' or 'CEO' roles can create a learning center.
 *
 *     tags:
 *       - Learning Centers
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - img
 *               - address
 *               - regionId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Najot Ta'lim"
 *               phone:
 *                 type: string
 *                 example: "+998901234567"
 *               img:
 *                 type: string
 *                 example: "https://example.com/image.png"
 *               address:
 *                 type: string
 *                 example: "Toshkent, Chilonzor 9 kvartal"
 *               regionId:
 *                 type: integer
 *                 example: 3
 *
 *               professionsId:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1]
 *               subjectsId:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1]
 *     responses:
 *       201:
 *         description: Learning Center successfully created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized (Token missing or invalid)
 *       403:
 *         description: Forbidden (User does not have required role)
 *       500:
 *         description: Server error
 */

route.post("/", roleAuthMiddleware(["ADMIN", "CEO"]), async (req, res) => {
  let { error } = learningCenterValidation.validate(req.body);
  if (error) {
    centerLogger.log("warn", "validation error");
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const { professionsId, subjectsId, name, phone, regionId, ...rest } =
      req.body;
    const userId = req?.userId;

    let exists = await LearningCenter.findOne({ where: { name } });
    if (exists) {
      centerLogger.log("warn", "name already exists");
      return res.status(400).json({ message: "Name already exists" });
    }

    let PhoneExists = await LearningCenter.findOne({ where: { phone } });
    if (PhoneExists) {
      centerLogger.log("warn", "phone already exists");
      return res.status(400).json({ message: "Phone already exists" });
    }

    const region = await Region.findByPk(regionId);
    if (!region) {
      centerLogger.log("warn", "region not found");
      return res.status(404).json({ message: "Region not found" });
    }

    console.log("Creating Learning Center...");
    const learningCenter = await LearningCenter.create({
      name,
      phone,
      regionId,
      userId,
      ...rest,
    });

    console.log("Learning Center Created:", learningCenter);

    if (!Array.isArray(professionsId) || professionsId.length === 0) {
      return res
        .status(400)
        .json({ message: "professionsId is required and must be an array" });
    }

    console.log("Fetching existing professions...");
    const existingProfessions = await Profession.findAll({
      where: { id: professionsId },
      attributes: ["id"],
    });

    const existingIds = existingProfessions.map((p) => p.id);
    const invalidIds = professionsId.filter((id) => !existingIds.includes(id));

    if (invalidIds.length > 0) {
      centerLogger.log("warn", "Some professions not found");
      console.log("Invalid Professions:", invalidIds);
      return res.status(404).json({
        message: "Some professions not found",
        invalidIds,
      });
    }

    console.log("Creating profession associations...");
    const professionData = professionsId.map((id) => ({
      professionId: id,
      learningCenterId: learningCenter.id,
    }));

    await Field.bulkCreate(professionData);

    if (subjectsId && subjectsId.length > 0) {
      console.log("Creating subject associations...");
      const subjectData = subjectsId.map((id) => ({
        subjectId: id,
        learningCenterId: learningCenter.id,
      }));
      await SubCenter.bulkCreate(subjectData);
    }

    res.status(201).json({
      message: "Learning Center created successfully",
      data: learningCenter,
    });
  } catch (error) {
    console.log("Error details:", error);

    let errorMessage = "Error creating Learning Center";
    if (
      error.name === "SequelizeValidationError" ||
      error.name === "SequelizeUniqueConstraintError"
    ) {
      errorMessage = error.errors.map((e) => e.message).join(", ");
    }

    centerLogger.log("error", errorMessage);

    res.status(500).json({
      message: errorMessage,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /learning-centers:
 *   get:
 *     summary: Get all Learning Centers with filters, sorting, and pagination
 *     tags: [Learning Centers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search learning centers by name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt]
 *         description: Column to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sorting order (ascending or descending)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of learning centers
 *       500:
 *         description: Server error
 */

route.get(
  "/",

  async (req, res) => {
    try {
      let { search, sortBy, order, page, limit } = req.query;

      sortBy = sortBy || "createdAt";
      order = order || "DESC";
      page = parseInt(page) || 1;
      limit = parseInt(limit) || 10;
      let offset = (page - 1) * limit;

      let whereCondition = {};
      if (search) {
        whereCondition.name = { [Op.like]: `%${search}%` };
      }

      const learningCenters = await LearningCenter.findAndCountAll({
        include: [
          { model: Branch, attributes: ["id", "name", "address"] },
          { model: Region, attributes: ["name"] },
          {
            model: Branch,

            attributes: ["id", "name", "address"],
          },
          { model: Region, attributes: ["name"] },
          {
            model: Users,
            as: "registeredUser",
            attributes: ["id", "firstName", "lastName"],
          },
          { model: Subject, as: "subjects", through: { attributes: [] } },
          { model: Like, attributes: ["id", "learningCenterId", "userId"] },
          {
            model: Subject,
            as: "subjects",

            through: { attributes: [] },
          },
          {
            model: Comments,
            attributes: ["id", "message", "userId", "learningCenterId"],
          },
          { model: Profession },
        ],
        attributes: {
          include: [
            [
              Sequelize.literal(`(
          SELECT COUNT(*) 
          FROM layklar 
          WHERE layklar.learningCenterId 
        )`),
              "numberOfLikes",
            ],
          ],
        },
        where: whereCondition,
        order: [[sortBy, order]],
        limit,
        offset,
      });

      centerLogger.log("info", "get qilindi");

      res.status(200).send({
        total: learningCenters.count.length,
        page,
        limit,
        data: learningCenters.rows,
      });
    } catch (error) {
      centerLogger.log("error", "internal server error");

      res.status(500).send({
        message: "Error fetching Learning Centers",
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /learning-centers/{id}:
 *   get:
 *     summary: Get a specific learning center by ID
 *     tags: [Learning Centers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the learning center to retrieve
 *     responses:
 *       200:
 *         description: Learning center details
 *       404:
 *         description: Learning center not found
 *       500:
 *         description: Internal server error
 */
route.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const learningCenter = await LearningCenter.findByPk(id, {
      include: [
        { model: Branch, attributes: ["id", "name", "address"] },
        { model: Region, attributes: ["name"] },
        {
          model: Users,
          as: "registeredUser",
          attributes: ["id", "firstName", "lastName"],
        },
        { model: Like, attributes: ["id", "learningCenterId", "userId"] },

        { model: Subject, as: "subjects", through: { attributes: [] } },
        { model: Comments },
        { model: Profession },
      ],
      attributes: {
        include: [
          [
            Sequelize.literal(`(
          SELECT COUNT(*) 
          FROM layklar 
          WHERE layklar.learningCenterId
        )`),
            "numberOfLikes",
          ],
        ],
      },
    });

    if (!learningCenter) {
      return res.status(404).json({ message: "Learning Center not found" });
    }

    res.status(200).json({ learningCenter });
    res.status(200).send({ message: "Learning center", data: learningCenter });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching Learning Center",
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /learning-centers/{id}:
 *   patch:
 *     summary: Update a Learning Center by ID
 *     tags: [Learning Centers]
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
 *
 *     responses:
 *       200:
 *         description: Learning Center updated
 *       404:
 *         description: Learning Center not found
 */

route.patch(
  "/:id",
  roleAuthMiddleware(["ADMIN", "CEO", "SUPER_ADMIN"]),
  async (req, res) => {
    try {
      const { regionId } = req.body;
      const region = await Region.findByPk(regionId);
      if (!region) {
        centerLogger.log("warn", "region not found");
        return res.status(404).json({ message: "Region not found" });
      }
      const learningCenter = await LearningCenter.findByPk(req.params.id);
      if (!learningCenter) {
        centerLogger.log("warn", "center not found");

        return res.status(404).send({ message: "Learning Center not found" });
      }
      await learningCenter.update(req.body);
      centerLogger.log("info", "patch qilindi");

      res
        .status(200)
        .send({ message: "Learning Center updated", data: learningCenter });
    } catch (error) {
      centerLogger.log("error", "internal server error");

      res.status(500).send({
        message: "Error updating Learning Center",
        error: error.message,
      });
    }
  }
);

/**
 * @swagger
 * /learning-centers/{id}:
 *   delete:
 *     summary: Delete a Learning Center by ID
 *
 *
 *     tags: [Learning Centers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Learning Center deleted
 *       404:
 *         description: Learning Center not found
 */
route.delete("/:id", roleAuthMiddleware(["ADMIN", "CEO"]), async (req, res) => {
  try {
    const learningCenter = await LearningCenter.findByPk(req.params.id);

    if (!learningCenter) {
      centerLogger.log("warn", "center not found");

      return res.status(404).send({ message: "Learning Center not found" });
      return res.status(404).send({ message: "Learning Center not found" });
    }
    centerLogger.log("info", "deleted");

    await learningCenter.destroy();
    res.status(200).send({ message: "Learning Center deleted" });
  } catch (error) {
    centerLogger.log("error", "internal server error");

    res.status(500).send({
      message: "Error deleting Learning Center",
      error: error.message,
    });
  }
});

module.exports = route;
