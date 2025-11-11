import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🧱 Setup upload folder
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// 🧩 CREATE Redemption
router.post("/", verifyToken, upload.array("images"), async (req, res) => {
  try {
    const { categoryId, coins, status, translations } = req.body;
    const files = req.files;

    if (!categoryId || !coins || !status || !translations) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const parsedTranslations = JSON.parse(translations);

    // store main image (first file)
    const imagePath = files?.length ? `/uploads/${files[0].filename}` : null;

    const [result] = await pool.query(
      "INSERT INTO redemptions (category_id, coins, image, status) VALUES (?, ?, ?, ?)",
      [categoryId, coins, imagePath, status]
    );

    const redemptionId = result.insertId;

    // insert translations
    for (const t of parsedTranslations) {
      await pool.query(
        `INSERT INTO redemption_translations (redemption_id, language, title, sub_title, description)
         VALUES (?, ?, ?, ?, ?)`,
        [redemptionId, t.language, t.title, t.sub_title, t.description]
      );
    }

    res.json({ message: "Redemption created successfully", id: redemptionId });
  } catch (err) {
    console.error("Create redemption error:", err);
    res.status(500).json({ message: "Server error creating redemption" });
  }
});

// 🧩 GET All Redemptions
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.*, c.name AS category_name
      FROM redemptions r
      LEFT JOIN categories c ON r.category_id = c.id
      ORDER BY r.created_at DESC
    `);

    for (const r of rows) {
      const [translations] = await pool.query(
        "SELECT language, title, sub_title, description FROM redemption_translations WHERE redemption_id = ?",
        [r.id]
      );
      r.translations = translations;
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching redemptions" });
  }
});

// 🧩 DELETE Redemption by ID
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if redemption exists
    const [rows] = await pool.query("SELECT * FROM redemptions WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Redemption not found" });
    }

    // Delete related translations first (foreign key cascade may already handle it)
    await pool.query("DELETE FROM redemption_translations WHERE redemption_id = ?", [id]);

    // Delete redemption record
    await pool.query("DELETE FROM redemptions WHERE id = ?", [id]);

    res.json({ message: "Redemption deleted successfully" });
  } catch (err) {
    console.error("Delete redemption error:", err);
    res.status(500).json({ message: "Server error deleting redemption" });
  }
});

// POST /api/redemptions/by-category
router.post("/by-category", verifyToken, async (req, res) => {
  try {
    const { categoryId, language } = req.body;

    if (!categoryId) {
      return res.status(400).json({ message: "categoryId is required" });
    }

    const [rows] = await pool.query(
      `SELECT 
          r.id, r.category_id, r.coins, r.image, r.status,
          r.used_at, r.created_at, r.updated_at, 
          c.name AS category_name,
          rt.language, rt.title, rt.sub_title, rt.description
        FROM redemptions r
        LEFT JOIN categories c ON r.category_id = c.id
        LEFT JOIN redemption_translations rt 
          ON r.id = rt.redemption_id
          ${language ? "AND rt.language = ?" : ""}
        WHERE r.category_id = ? 
        ORDER BY r.created_at DESC`,
      language ? [language, categoryId] : [categoryId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Fetch by category error:", err);
    res.status(500).json({ message: "Server error fetching by category" });
  }
});


export default router;
