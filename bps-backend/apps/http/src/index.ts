import express from "express";
import v1_router from "./routes/v1";
import client from "@repo/db";
import cookieParser from "cookie-parser";


const app = express();
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", v1_router);

app.listen(process.env.PORT || 3000);