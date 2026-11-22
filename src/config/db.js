// src/config/db.js
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
}

const dbName = new URL(uri).pathname.replace("/", "") || "mentorlagbe";
const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
});
const db = client.db(dbName);

let connectionPromise = null;
let indexesEnsured = false;

/**
 * Safe to call on every request.
 * - The successful promise is kept and reused (no repeated connects).
 * - If a connection attempt fails, the promise is cleared so the
 *   next request retries instead of leaving the instance stuck.
 * - Index problems are logged but never block the API.
 */
export function connectDB() {
    if (!connectionPromise) {
        connectionPromise = (async () => {
            await client.connect(); // does nothing if already connected
            console.log(`Connected to MongoDB database: ${db.databaseName}`);

            if (!indexesEnsured) {
                try {
                    await Promise.all([
                        db.collection("users").createIndex({ email: 1 }, { unique: true }),
                        db.collection("tuitions").createIndex({ approvalStatus: 1, isActive: 1, createdAt: -1 }),
                        db.collection("tuitions").createIndex({ title: "text", subject: "text" }),
                        db.collection("applications").createIndex({ tuitionId: 1, studentEmail: 1 }, { unique: true }),
                        db.collection("payments").createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true }),
                    ]);
                    indexesEnsured = true;
                } catch (err) {
                    console.error("Index creation failed:", err.message);
                }
            }

            return { client, db };
        })().catch((err) => {
            connectionPromise = null; // allow a retry on the next request
            throw err;
        });
    }
    return connectionPromise;
}

export function getCollections() {
    return {
        users: db.collection("users"),
        tuitions: db.collection("tuitions"),
        applications: db.collection("applications"),
        payments: db.collection("payments"),
        bookmarks: db.collection("bookmarks"),
    };
}

export function toObjectId(id) {
    if (!id || !ObjectId.isValid(id)) return null;
    return new ObjectId(id);
}

export { client, db, ObjectId };
