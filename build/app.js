"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
