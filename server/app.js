import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db.js";
import propertyRoutes from "./routes/propertyRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Get Keja Backend Running 🚀",
  });
});

// API Routes
app.use("/api/properties", propertyRoutes);

// Test database connection
async function testDatabase() {
  try {
    const connection = await db.getConnection();
    console.log("✅ Connected to MySQL Database");
    connection.release();
  } catch (err) {
    console.error("❌ Database Error:", err.message);
  }
}

testDatabase();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});