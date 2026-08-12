import express from "express";

import dotenv from "dotenv";
dotenv.config();

import connectDB from "./db/connectdb";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bodyParser from "body-parser";
import serverRoutes from "./routes/serverRoutes";
import visitorKey from "./middlewares/visitorKey";

//Setup Express App
const app = express();
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: allowedOrigins, exposedHeaders: ["Authorization"] }));
app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT || 2000),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: visitorKey,
  // Login and external ingestion have dedicated, stricter limiters.
  skip: (req) => req.path === '/api/v1/user/login' || req.path === '/api/v1/external/leads',
  message: { message: 'Too many API requests. Please wait a few minutes and try again.' },
}));

//Set Midleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/api/v1", serverRoutes);

// Get port from environment and store in Express.
const port = process.env.PORT || "5000";
const DATABASE_URL = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DATABASE;

if (!DATABASE_URL || !DB_NAME || !process.env.JWT_SECRET) {
  throw new Error("MONGODB_URI, MONGODB_DATABASE, and JWT_SECRET are required");
}

connectDB(DATABASE_URL, DB_NAME)
  .then(() => app.listen(port, () => console.log(`API listening on port ${port}`)))
  .catch((error) => {
    console.error("Unable to start API:", error);
    process.exit(1);
  });
