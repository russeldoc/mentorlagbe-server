import jwt from "jsonwebtoken";
import { auth } from "../config/auth.js";
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

/**
 * Syncs a user record in the `users` collection and returns a signed JWT.
 * Supports registration role selection ('student' | 'tutor') with default plan: 'free'.
 */
export async function syncSessionAndIssueJwt(req, res, next) {
    try {
        const { email, name, image, role, phone, bio } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required to issue token." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const { users } = getCollections();

        // Check BetterAuth session headers if provided
        let sessionUser = null;
        try {
            const session = await auth.api.getSession({ headers: req.headers });
            if (session?.user) {
                sessionUser = session.user;
            }
        } catch {
            // Optional session lookup fallback
        }

        const existingUser = await users.findOne({ email: normalizedEmail });

        // Only allow 'student' or 'tutor' during self-registration/sync; preserve existing 'admin' role
        const requestedRole = role === "tutor" ? "tutor" : "student";

        if (!existingUser) {
            const newDoc = {
                name: (name || sessionUser?.name || normalizedEmail.split("@")[0]).trim(),
                email: normalizedEmail,
                image: image || sessionUser?.image || "",
                role: sessionUser?.role === "admin" ? "admin" : requestedRole,
                phone: phone || "",
                bio: bio || "",
                plan: "free",
                createdAt: new Date(),
            };

            const insertResult = await users.insertOne(newDoc);
            const createdUser = { ...newDoc, _id: insertResult.insertedId };
            const token = signUserJwt(createdUser);

            return res.status(200).json({
                token,
                user: createdUser,
            });
        }

        const updates = {};
        if (name && name.trim()) updates.name = name.trim();
        if (typeof image === "string") updates.image = image;
        if (typeof phone === "string") updates.phone = phone;
        if (typeof bio === "string") updates.bio = bio;

        if (Object.keys(updates).length > 0) {
            await users.updateOne({ _id: existingUser._id }, { $set: updates });
        }

        const updatedUser = await users.findOne({ _id: existingUser._id });
        const token = signUserJwt(updatedUser);

        return res.status(200).json({
            token,
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
}

export async function getCurrentUser(req, res) {
    return res.status(200).json({ user: req.user });
}