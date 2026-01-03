import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import testRoutes from "./routes/test.routes.js"
import contactRoutes from "./routes/contact.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("✅ Backend is running fine");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
app.use("/api", testRoutes);
app.use("/api", contactRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
