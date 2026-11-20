import { getCollections, toObjectId } from "../config/db.js";

export async function updateProfile(req, res, next) {
    try {
        const { name, phone, bio, image } = req.body;
        const { users } = getCollections();

        const updateFields = {};
        if (typeof name === "string" && name.trim()) updateFields.name = name.trim();
        if (typeof phone === "string") updateFields.phone = phone.trim();
        if (typeof bio === "string") updateFields.bio = bio.trim();
        if (typeof image === "string") updateFields.image = image.trim();

        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "No valid profile fields provided." });
        }

        await users.updateOne(
            { email: req.user.email },
            { $set: updateFields }
        );

        const updatedUser = await users.findOne({ email: req.user.email });
        return res.status(200).json({
            message: "Profile updated successfully.",
            user: updatedUser,
        });
    } catch (error) {
        next(error);
    }
}

export async function getAllUsers(req, res, next) {
    try {
        const { users } = getCollections();
        const allUsers = await users.find({}).sort({ createdAt: -1 }).toArray();
        return res.status(200).json({ users: allUsers });
    } catch (error) {
        next(error);
    }
}

export async function updateUserRole(req, res, next) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!["student", "tutor", "admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role. Must be student, tutor, or admin." });
        }

        const objectId = toObjectId(id);
        if (!objectId) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const { users } = getCollections();
        const result = await users.findOneAndUpdate(
            { _id: objectId },
            { $set: { role } },
            { returnDocument: "after" }
        );

        if (!result) {
            return res.status(404).json({ message: "User not found." });
        }

        return res.status(200).json({
            message: `User role updated to ${role}.`,
            user: result,
        });
    } catch (error) {
        next(error);
    }
}