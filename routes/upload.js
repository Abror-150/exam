const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/**
 * @swagger
 * /upload:
 *   post:
 *     summary: Rasm yuklash
 *     description: Foydalanuvchi rasm yuklashi va unga URL olishi mumkin.
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Yuklanadigan rasm fayli
 *     responses:
 *       200:
 *         description: Yuklangan rasm URL'ini qaytaradi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: Yuklangan rasmning to‘liq URL manzili
 *                   example: "http://localhost:3000/uploads/1710853424-product.jpg"
 */
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Fayl yuklanmadi" });
  }

  res.json({
    message: "Fayl muvaffaqiyatli yuklandi",
    url: `http://localhost:3000/uploads/${req.file.filename}`,
  });
});

/**
 * @swagger
 * /upload/{filename}:
 *   get:
 *     summary: Rasmni olish
 *     description: Berilgan fayl nomi bo‘yicha yuklangan rasmni qaytaradi.
 *     tags: [Upload]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Yuklangan fayl nomi
 *     responses:
 *       200:
 *         description: Rasm fayli qaytariladi
 *       404:
 *         description: Fayl topilmadi
 */
router.get("/:filename", (req, res) => {
  const filePath = path.join(__dirname, "../uploads", req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fayl topilmadi" });
  }

  res.sendFile(filePath);
});

module.exports = router;
