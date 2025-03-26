// const { Router } = require("express");
// const { Op } = require("sequelize");
// const route = Router();
// const roleAuthMiddleware = require("../middlewares/roleAuth");

// route.post("/", async (req, res) => {
//   //   const { error } = subjectSchema.validate(req.body);
//   //   if (error) {
//   //     return res.status(400).json({ error: error.details[0].message });
//   //   }

//   try {
//     const userId = req.userId;
//     const { data } = req.body;
//     if (!data) {
//       return res.status(404).send({ message: "data not found" });
//     }
//     const one = await Subject.create({ userId, data });
//     res.status(201).json(one);
//   } catch (error) {
//     console.log(error);

//     res.status(500).json({ error: "Server xatosi", details: error.message });
//   }
// });

// route.patch(
//   "/:id",
//   roleAuthMiddleware(["ADMIN", "SUPER_ADMIN"]),
//   async (req, res) => {
//     try {
//       const { id } = req.params;
//       const one = await Subject.findByPk(id);
//       if (!one) {
//         return res.status(404).send({ error: "subject not found" });
//       }
//       await one.update(req.body);
//       res.json(one);
//     } catch (error) {
//       res.status(500).json({ error: "Server xatosi", details: error.message });
//     }
//   }
// );
// /**
//  * @swagger
//  * /subjects/{id}:
//  *   delete:
//  *     summary: Fan o‘chirish
//  *     tags: [Subjects]
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: integer
//  *         description: Fan ID si
//  *     responses:
//  *       200:
//  *         description: Fan o‘chirildi
//  *       404:
//  *         description: Fan topilmadi
//  */

// route.delete("/:id", roleAuthMiddleware(["ADMIN"]), async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deleted = await Subject.destroy({ where: { id } });
//     if (deleted) {
//       return res.send({ message: "subject o'chirildi" });
//     }
//     res.status(404).send({ error: "subject topilmadi" });
//   } catch (error) {
//     res.status(500).send({ error: "Server xatosi", details: error.message });
//   }
// });

// module.exports = route;
