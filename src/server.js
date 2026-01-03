import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import testRoutes from "./routes/test.routes.js"
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ ROOT TEST ROUTE
app.get("/", (req, res) => {
  res.status(200).send("✅ Backend is running fine");
});

// ✅ SECOND TEST ROUTE
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use("/api", testRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
