// src/app.js
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import { connectDB, db } from "./config/db.js";
import { handleStripeWebhook } from "./controllers/paymentController.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import tuitionRoutes from "./routes/tuitionRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

/* ---------------------------- CORS (first) ---------------------------- */
const allowedOrigins = [
    process.env.CLIENT_URL,
    "https://mentorlagbe-client-kappa.vercel.app",
    "http://localhost:3000",
].filter(Boolean);

// Allows Vercel preview deployments of the client
const vercelPreview = /^https:\/\/mentorlagbe-client[a-z0-9-]*\.vercel\.app$/;

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin) || vercelPreview.test(origin)) {
                return callback(null, true);
            }
            return callback(null, false); // reject cleanly, don't throw
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

/* ------------------ Ensure MongoDB is connected (Vercel) ------------------ */
// Placed after CORS so even a failed request still carries CORS headers.
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("DB connect failed:", err);
        res.status(500).json({ success: false, message: "Database connection failed." });
    }
});

/* ------------------------------ Stripe webhook ------------------------------ */
// MUST receive the raw body before express.json()
app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
);

/* -------------------------------- BetterAuth -------------------------------- */
// Mount before body-parsing middleware
app.all("/api/auth/*", toNodeHandler(auth));

/* ------------------------------- Body parsers ------------------------------- */
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

/* ------------------------------ Health checks ------------------------------ */
app.get("/", (req, res) => {
    res.status(200).json({ status: "ok", service: "MentorLagbe API" });
});

app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "MentorLagbe API" });
});

app.get("/api/db-health", async (req, res) => {
    try {
        await db.command({ ping: 1 });
        res.status(200).json({ status: "ok", message: "MongoDB connected successfully" });
    } catch (error) {
        console.error("MongoDB ping failed:", error);
        res.status(500).json({ status: "error", message: "MongoDB connection failed" });
    }
});

/* ---------------------------- Application routes ---------------------------- */
app.use("/api/auth-session", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tuitions", tuitionRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/stats", statsRoutes);

/* ------------------------- 404 & global error handling ------------------------- */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
