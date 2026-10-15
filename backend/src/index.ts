
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
    res.send("Ingrezy Backend is running!");
});

app.get("/api/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Ingrezy API is healthy",
    });
});

app.listen(PORT, () => {
    console.log(`Ingrezy server running at http://localhost:${PORT}`);
});
