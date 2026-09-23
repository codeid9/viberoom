import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "VibeRoom server is running 🚀",
  });
});

app.listen(PORT, () => {
  console.log(`VibeRoom server running on http://localhost:${PORT}`);
});