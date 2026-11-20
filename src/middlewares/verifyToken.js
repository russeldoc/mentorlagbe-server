import jwt from "jsonwebtoken";
import { getCollections } from "../config/db.js";

export async function verifyToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: Missing or malformed token." });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { users } = getCollections();
        const dbUser = await users.findOne(
            { email: decoded.email.toLowerCase() },
            { projection: { name: 1, email: 1, image: 1, role: 1, plan: 1, phone: 1, bio: 1 } }
        );

        if (!dbUser) {
            return res.status(401).json({ message: "Unauthorized: User account not found." });
        }

        req.user = {
            _id: dbUser._id.toString(),
            name: dbUser.name,
            email: dbUser.email,
            image: dbUser.image || "",
            role: dbUser.role || "student",
            plan: dbUser.plan || "free",
            phone: dbUser.phone || "",
            bio: dbUser.bio || "",
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token." });
    }
}