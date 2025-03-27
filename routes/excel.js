const express = require("express");
const router = express.Router();
const ExcelJS = require("exceljs");
const Comments = require("../models/comment");
const Branch = require("../models/branches");
const LearningCenter = require("../models/learningCenter");
const Resource = require("../models/resource");
const Users = require("../models/user");
const ResourceCategories = require("../models/resourceCategory");
const Region = require("../models/regions");

/**
 * @swagger
 * tags:
 *   name: Export
 *   description: Export data to Excel files
 */

/**
 * Excel fayl yaratish funksiyasi
 */
const createExcelFile = async (data, headers, sheetName, res, fileName) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.addRow(headers);
  data.forEach((item) => sheet.addRow(Object.values(item)));

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * @swagger
 * /export/comments:
 *   get:
 *     summary: Download user's comments as Excel
 *     tags: [Export]
 *     produces:
 *       - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 *     responses:
 *       200:
 *         description: Download Excel file with user's comments
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/comments", async (req, res) => {
  try {
    const userId = req.userId;
    const comments = await Comments.findAll({
      where: { user_id: userId },
    //   include: [
    //     { model: LearningCenter, attributes: ["name"] },
    //     { model: Branch, attributes: ["name"] },
    //   ],
    });

    const formattedComments = comments.map((comment) => [
      comment.id,
      comment.message,
      comment.star,
      comment.LearningCenter?.name || "N/A",
      comment.userId,
    ]);

    await createExcelFile(
      formattedComments,
      ["ID", "Message", "Stars", "Learning Center", "User ID"],
      "Comments",
      res,
      "my_comments"
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /export/edu-centers:
 *   get:
 *     summary: Download user's education centers as Excel
 *     tags: [Export]
 *     produces:
 *       - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 *     responses:
 *       200:
 *         description: Download Excel file with user's education centers
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/edu-centers", async (req, res) => {
  try {
    const userId = req.userId;
    const eduCenters = await LearningCenter.findAll({
      where: { user_id: userId },
      include: [{ model: Region, attributes: ["name"] }],
    });

    const formattedEduCenters = eduCenters.map((edu) => [
      edu.id,
      edu.name,
      edu.phone,
      edu.address,
      edu.region?.name || "N/A",
      edu.branchNumber,
      edu.user_id,
      edu.img,
    ]);

    await createExcelFile(
      formattedEduCenters,
      [
        "ID",
        "Name",
        "Phone",
        "Address",
        "Region",
        "Branch Number",
        "User ID",
        "Img",
      ],
      "Learning Center",
      res,
      "my_edu_centers"
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /export/resources:
 *   get:
 *     summary: Download user's resources as Excel
 *     tags: [Export]
 *     produces:
 *       - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 *     responses:
 *       200:
 *         description: Download Excel file with user's resources
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/resources", async (req, res) => {
  try {
    const userId = req.userId;
    const resources = await Resource.findAll({
      where: { user_id: userId },
      include: [{ model: ResourceCategories, attributes: ["name"] }],
    });

    const formattedResources = resources.map((resource) => [
      resource.id,
      resource.name,
      resource.categoryId || "N/A",
      resource.userId,
      resource.img,
      resource.file,
      resource.link,
      resource.describtion,
    ]);

    await createExcelFile(
      formattedResources,
      [
        "ID",
        "Name",
        "Category",
        "User ID",
        "Img",
        "File",
        "Link",
        "Describtion",
      ],
      "Resources",
      res,
      "my_resources"
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /export/profile:
 *   get:
 *     summary: Download user profile as Excel
 *     tags: [Export]
 *     produces:
 *       - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 *     responses:
 *       200:
 *         description: Download Excel file with user profile
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get("/profile", async (req, res) => {
  try {
    const userId = req.userId;
    const user = await Users.findByPk(userId, {
      attributes: ["id", "firstName", "email", "phone", "role", "createdAt"],
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    await createExcelFile(
      [
        [
          user.id,
          user.firstName,
          user.email,
          user.role,
          user.phone,
          user.createdAt,
        ],
      ],
      ["ID", "Fullname", "Email", "Role", "Phone", "Created At"],
      "Profile",
      res,
      "my_profile"
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
