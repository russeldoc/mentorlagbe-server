import crypto from "crypto";
import jwt from "jsonwebtoken";
import { getCollections } from "../config/db.js";

function signUserJwt(user) {
    return jwt.sign(
        {
            sub: user._id.toString(),
            email: user.email,
            role: user.role || "student",
            plan: user.plan || "free",
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${derivedKey}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.includes(":")) return false;
    const [salt, originalHex] = storedHash.split(":");
    const derivedBuf = crypto.scryptSync(password, salt, 64);
    const originalBuf = Buffer.from(originalHex, "hex");
    if (derivedBuf.length !== originalBuf.length) return false;
    return crypto.timingSafeEqual(derivedBuf, originalBuf);
}

function sanitizeUser(userDoc) {
    const { passwordHash, ...safeUser } = userDoc;
    return safeUser;
}

/**
 * POST /api/auth-session/register
 * Creates a new user with a salted scrypt passwordHash, role ('student' | 'tutor'), and plan: 'free'.
 */
export async function registerUser(req, res, next) {
    try {
        const { name, email, password, role, phone, bio, image } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }
        if (String(password).length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const { users } = getCollections();

        const existing = await users.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({ message: "An account with this email already exists." });
        }

        const assignedRole = role === "tutor" ? "tutor" : "student";
        const newDoc = {
            name: name.trim(),
            email: normalizedEmail,
            passwordHash: hashPassword(String(password)),
            image: image || "",
            role: assignedRole,
            phone: phone || "",
            bio: bio || "",
            plan: "free",
            createdAt: new Date(),
        };

        const insertResult = await users.insertOne(newDoc);
        const createdUser = { ...newDoc, _id: insertResult.insertedId };
        const token = signUserJwt(createdUser);

        return res.status(201).json({
            token,
            user: sanitizeUser(createdUser),
        });
    } catch (error) {
        next(error);
    }
}

/**
 * POST /api/auth-session/login
 * Verifies email + password against passwordHash and issues a JWT.
 */
export async function loginUser(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const { users } = getCollections();

        const userDoc = await users.findOne({ email: normalizedEmail });
        if (!userDoc || !userDoc.passwordHash) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const isValid = verifyPassword(String(password), userDoc.passwordHash);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid email or password." });
        }

        const token = signUserJwt(userDoc);
        return res.status(200).json({
            token,
            user: sanitizeUser(userDoc),
        });
    } catch (error) {
        next(error);
    }
}

export async function getCurrentUser(req, res) {
    return res.status(200).json({ user: req.user });
}