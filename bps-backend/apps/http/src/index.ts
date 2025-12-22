import express from "express";
import { router as v1_router } from "./routes/v1";
import client from "@repo/db";

const app = express();

app.use("/api/v1", v1_router);

app.listen(process.env.PORT || 3000);