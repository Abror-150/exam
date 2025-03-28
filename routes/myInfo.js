const { Router } = require('express');
const Like = require('../models/likes');
const Comments = require('../models/comment');
const Resource = require('../models/resource');
const Users = require('../models/user');
const CourseRegister = require('../models/courseRegister');
const Branch = require('../models/branches');
const LearningCenter = require('../models/learningCenter');
const roleAuthMiddleware = require('../middlewares/roleAuth');
const { getRouteLogger } = require('../logger/logger');

const myInfoLogger = getRouteLogger(__filename);
const route = Router();

/**
 * @swagger
 * /myInfo:
 *   get:
 *     summary: Foydalanuvchining shaxsiy ma'lumotlarini olish
 *     description: Foydalanuvchining profili, resurslari, izohlari, yoqtirgan markazlari va kurs ro‘yxati olinadi.
 *     tags:
 *       - User
 *
 *     responses:
 *       200:
 *         description: Foydalanuvchi ma'lumotlari muvaffaqiyatli olindi.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phoneNumber:
 *                       type: string
 *                     resources:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           img:
 *                             type: string
 *                           media:
 *                             type: string
 *                           description:
 *                             type: string
 *                     comments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           comment:
 *                             type: string
 *                           star:
 *                             type: integer
 *                           learningCenterId:
 *                             type: integer
 *                     likes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           learningCenterId:
 *                             type: integer
 *                     courseRegister:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           learningCenterId:
 *                             type: integer
 *                           branchId:
 *                             type: integer
 *                           branch:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                           learningCenter:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *       404:
 *         description: Foydalanuvchi topilmadi.
 *       500:
 *         description: Server xatosi.
 */

route.get('/myInfo', roleAuthMiddleware(['ADMIN']), async (req, res) => {
  try {
    const userId = req.userId;

    const user = await Users.findOne({
      where: { id: userId },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
      include: [
        {
          model: Resource,
        },
        {
          model: Comments,
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
      myInfoLogger.log('warn', 'user not found');
      return res.status(404).json({ message: 'User not found' });
    }
    myInfoLogger.log('info', 'get qilindi');

    res.json({ data: user });
  } catch (error) {
    myInfoLogger.log('error', 'internal server error');

    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = route;
