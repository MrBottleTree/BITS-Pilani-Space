import express from "express";
import v1_router from "./routes/v1/index.js";
import cookieParser from "cookie-parser";
import { client } from "@repo/db";
import cors from "cors";

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use("/api/v1", v1_router);

async function startServer() {
  try {
    console.log("Connecting to database...");
    await client.$connect();
    console.log("Database connected successfully");

    const PORT = Number(process.env.PORT) || 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is now ready and listening on 0.0.0.0:${PORT}`);
    });

  } catch (error) {
    console.error("Critical: Database connection failed. Server will not start.");
    console.error(error);
    process.exit(1);
  }
}

startServer();