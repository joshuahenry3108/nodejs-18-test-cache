import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Simple Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", service: "Webservice Only" });
});

// ✅ Example endpoint
app.get("/hello", (req, res) => {
  res.json({ message: "Hello from Webservice!" });
});

// ✅ Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Webservice running on port ${PORT}`);
});
