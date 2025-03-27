const { Router } = require('express');
const Like = require('../models/likes');
const Comments = require('../models/comment');
const Resource = require('../models/resource');
const Users = require('../models/user');
const CourseRegister = require('../models/courseRegister');
const Branch = require('../models/branches');
const LearningCenter = require('../models/learningCenter');
const roleAuthMiddleware = require('../middlewares/roleAuth');

const route = Router();

route.get('/myInfo', roleAuthMiddleware(['USER']), async (req, res) => {
  try {
    const userId = req.userId;

    const user = await Users.findOne({
      where: { id: userId },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'],
      include: [
        {
          model: Resource,
          attributes: ['name', 'img', 'media', 'description'],
        },
        {
          model: Comments,
          attributes: ['comment', 'star', 'learningCenterId'],
        },
        {
          model: Like,
          attributes: ['learningCenterId'],
        },
        {
          model: CourseRegister,
          attributes: ['learningCenterId', 'branchId'],
          include: [
            {
              model: Branch,
              attributes: ['id', 'name'],
              as: 'branch',
            },
            {
              model: LearningCenter,
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = route;
