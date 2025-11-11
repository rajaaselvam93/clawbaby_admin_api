import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import redemptionRoutes from "./routes/redemption.js";
import categoryRoutes from "./routes/category.js";

dotenv.config();
const app = express();

// ✅ 1. Apply CORS globally and allow all methods
app.use(cors({
  origin: "*", // Replace with your frontend URL if needed
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ 2. Handle preflight requests for all routes
app.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  return res.sendStatus(200);
});

app.use(express.json());

// ✅ 3. Routes
app.use("/api/auth", authRoutes);
app.use("/api/redemptions", redemptionRoutes);
app.use("/api/categories", categoryRoutes);

app.use("/uploads", express.static("uploads"));

// ✅ 4. Root test route
app.get("/", (req, res) => res.send("Clawbaby backend is live ✅"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
