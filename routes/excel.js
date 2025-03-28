const express = require('express');
const route = express.Router();
const ExcelJS = require('exceljs');
const Comments = require('../models/comment');
const Branch = require('../models/branches');
const LearningCenter = require('../models/learningCenter');
const Resource = require('../models/resource');
const Users = require('../models/user');
const ResourceCategories = require('../models/resourceCategory');
const Region = require('../models/regions');
const roleAuthMiddleware = require('../middlewares/roleAuth');

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
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename=${fileName}.xlsx`);

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
route.get('/comments', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const comments = await Comments.findAll({
      where: { userId },
      include: [
        { model: LearningCenter, attributes: ['name'] },
        { model: Branch, attributes: ['name'] },
        { model: Users, attributes: ['id', 'firstName', 'email'], as: 'user' },
      ],
    });

    const formattedComments = comments.map((comment) => [
      comment.id,
      comment.message,
      comment.star,
      comment.LearningCenter?.name || 'N/A',
      comment.Branch?.name || 'N/A',
      comment.userId,
      comment.User?.firstName || 'N/A',
      comment.User?.email || 'N/A',
    ]);

    await createExcelFile(
      formattedComments,
      [
        'ID',
        'Message',
        'Stars',
        'Learning Center',
        'Branch',
        'User ID',
        'User Name',
        'User Email',
      ],
      'Comments',
      res,
      'user_comments'
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
route.get('/edu-centers', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const userId = req.userId;

    const eduCenters = await LearningCenter.findAll({
      where: { userId },
      include: [{ model: Region, attributes: ['name'] }],
    });

    console.log('Fetched EduCenters:', JSON.stringify(eduCenters, null, 2));

    const formattedEduCenters = eduCenters.map((edu) => [
      edu.id,
      edu.name,
      edu.phone,
      edu.address,
      edu.Region?.name || 'N/A',
      edu.branchNumber,
      edu.user_id,
      edu.img,
    ]);

    await createExcelFile(
      formattedEduCenters,
      [
        'ID',
        'Name',
        'Phone',
        'Address',
        'Region',
        'Branch Number',
        'User ID',
        'Img',
      ],
      'Learning Center',
      res,
      'my_edu_centers'
    );
  } catch (error) {
    console.log('Error fetching edu centers:', error);
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
route.get('/resources', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const userId = req.userId;

    const resources = await Resource.findAll({
      where: { userId },
      include: [{ model: ResourceCategories, attributes: ['name'] }],
    });

    console.log('Fetched Resources:', JSON.stringify(resources, null, 2));

    const formattedResources = resources.map((resource) => [
      resource.id,
      resource.name,
      resource.Category?.name || 'N/A',
      resource.user_id,
      resource.img,
      resource.file,
      resource.link,
      resource.describtion,
    ]);

    await createExcelFile(
      formattedResources,
      [
        'ID',
        'Name',
        'Category',
        'User ID',
        'Img',
        'File',
        'Link',
        'Description',
      ],
      'Resources',
      res,
      'my_resources'
    );
  } catch (error) {
    console.log('Error fetching resources:', error);
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
route.get('/profile', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const userId = req.userId;
    const user = await Users.findByPk(userId, {
      attributes: ['id', 'firstName', 'email', 'phone', 'role', 'createdAt'],
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

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
      ['ID', 'Fullname', 'Email', 'Role', 'Phone', 'Created At'],
      'Profile',
      res,
      'my_profile'
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = route;
