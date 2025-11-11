import express from "express";
import { pool } from "../db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/categories
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name FROM categories ORDER BY name");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching categories" });
  }
});

export default router;
