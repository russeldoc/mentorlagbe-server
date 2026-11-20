import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import { handleStripeWebhook } from "./controllers/paymentController.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import tuitionRoutes from "./routes/tuitionRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:3000",
].filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
    })
);

// 1. Stripe Webhook MUST receive raw body before express.json()
app.post(
    "/api/payments/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
);

// 2. Mount BetterAuth handler before body-parsing middleware
app.all("/api/auth/*", toNodeHandler(auth));

// 3. JSON body parser for standard REST routes
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "MentorLagbe API" });
});

// Application routes
app.use("/api/auth-session", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tuitions", tuitionRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/stats", statsRoutes);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;