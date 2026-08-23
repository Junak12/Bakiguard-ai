import express from "express";
import cors from "cors";
import helmet from "helmet";    
import morgan from "morgan";


const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
    res.json({
        success:true,
        message : "Backend api is running",
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`BakiGuard API running on port ${PORT}`);
})