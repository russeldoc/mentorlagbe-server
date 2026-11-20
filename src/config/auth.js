import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { admin } from "better-auth/plugins";
import { client, db } from "./db.js";
import dotenv from "dotenv";

dotenv.config();

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000",
    basePath: "/api/auth",
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [
        process.env.CLIENT_URL || "http://localhost:3000",
        "http://localhost:3000",
    ],
    database: mongodbAdapter(db, { client }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "student",
                input: true,
            },
            phone: {
                type: "string",
                required: false,
                defaultValue: "",
                input: true,
            },
            bio: {
                type: "string",
                required: false,
                defaultValue: "",
                input: true,
            },
            plan: {
                type: "string",
                required: false,
                defaultValue: "free",
                input: false,
            },
        },
    },
    plugins: [admin()],
});