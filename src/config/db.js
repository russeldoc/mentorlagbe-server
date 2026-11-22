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

export async function connectDB() {
    if (client.topology && client.topology.isConnected()) {
        return { client, db };
    }

    if (!connectionPromise) {
        connectionPromise = (async () => {
            await client.connect();
            console.log(`Connected to MongoDB database: ${db.databaseName}`);

            if (!indexesEnsured) {
                await Promise.all([
                    db.collection("users").createIndex({ email: 1 }, { unique: true }),
                    db.collection("tuitions").createIndex({ approvalStatus: 1, isActive: 1, createdAt: -1 }),
                    db.collection("tuitions").createIndex({ title: "text", subject: "text" }),
                    db.collection("applications").createIndex({ tuitionId: 1, studentEmail: 1 }, { unique: true }),
                    db.collection("payments").createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true }),
                ]);
                indexesEnsured = true;
            }

            return { client, db };
        })().finally(() => {
            connectionPromise = null;
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