import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
}

const client = new MongoClient(uri);
const dbName = new URL(uri).pathname.replace("/", "") || "mentorlagbe";
const db = client.db(dbName);

let isConnected = false;

export async function connectDB() {
    if (isConnected) {
        return { client, db };
    }
    await client.connect();
    isConnected = true;
    console.log(`Connected to MongoDB database: ${db.databaseName}`);

    // Ensure helpful indexes
    await Promise.all([
        db.collection("users").createIndex({ email: 1 }, { unique: true }),
        db.collection("tuitions").createIndex({ approvalStatus: 1, isActive: 1, createdAt: -1 }),
        db.collection("tuitions").createIndex({ title: "text", subject: "text" }),
        db.collection("applications").createIndex({ tuitionId: 1, studentEmail: 1 }, { unique: true }),
        db.collection("payments").createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true }),
    ]);

    return { client, db };
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
    if (!ObjectId.isValid(id)) return null;
    return new ObjectId(id);
}

export { client, db, ObjectId };