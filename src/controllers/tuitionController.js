import { getCollections, toObjectId } from "../config/db.js";

/**
 * Public endpoint: returns only approved & active tuitions
 * Supports server-side search (title/subject), filters (classLevel, mode, subject), and pagination.
 */
export async function getPublicTuitions(req, res, next) {
    try {
        const {
            search = "",
            subject = "",
            classLevel = "",
            mode = "",
            page = "1",
            limit = "9",
            featured = "false",
        } = req.query;

        const { tuitions, users } = getCollections();

        const filter = {
            approvalStatus: "approved",
            isActive: true,
        };

        if (search.trim()) {
            const regex = new RegExp(search.trim(), "i");
            filter.$or = [{ title: regex }, { subject: regex }];
        }

        if (subject.trim() && subject.toLowerCase() !== "all") {
            filter.subject = new RegExp(`^${subject.trim()}$`, "i");
        }

        if (classLevel.trim() && classLevel.toLowerCase() !== "all") {
            filter.classLevel = new RegExp(`^${classLevel.trim()}$`, "i");
        }

        if (mode.trim() && ["online", "offline"].includes(mode.trim().toLowerCase())) {
            filter.mode = new RegExp(`^${mode.trim()}$`, "i");
        }

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = featured === "true" ? 6 : Math.min(Math.max(parseInt(limit, 10) || 9, 1), 50);
        const skip = featured === "true" ? 0 : (pageNum - 1) * limitNum;

        const [totalCount, items] = await Promise.all([
            tuitions.countDocuments(filter),
            tuitions.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).toArray(),
        ]);

        // Enrich with tutor profile summary (plan badge, bio, avatar)
        const tutorEmails = [...new Set(items.map((item) => item.tutorEmail).filter(Boolean))];
        const tutorDocs = await users
            .find({ email: { $in: tutorEmails } }, { projection: { email: 1, name: 1, image: 1, plan: 1, bio: 1 } })
            .toArray();
        const tutorMap = new Map(tutorDocs.map((t) => [t.email, t]));

        const enrichedTuitions = items.map((item) => ({
            ...item,
            tutorProfile: tutorMap.get(item.tutorEmail) || null,
        }));

        return res.status(200).json({
            tuitions: enrichedTuitions,
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / limitNum) || 1,
                currentPage: pageNum,
                limit: limitNum,
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function getTuitionById(req, res, next) {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            return res.status(400).json({ message: "Invalid tuition ID." });
        }

        const { tuitions, users } = getCollections();
        const tuition = await tuitions.findOne({ _id: objectId });

        if (!tuition) {
            return res.status(404).json({ message: "Tuition post not found." });
        }

        const tutorProfile = await users.findOne(
            { email: tuition.tutorEmail },
            { projection: { name: 1, email: 1, image: 1, plan: 1, bio: 1, phone: 1 } }
        );

        return res.status(200).json({
            tuition: {
                ...tuition,
                tutorProfile: tutorProfile || null,
            },
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Tutor: Create tuition post.
 * Free plan tutors can create up to 2 posts; Pro plan tutors can create unlimited posts.
 */
export async function createTuition(req, res, next) {
    try {
        const {
            title,
            subject,
            classLevel,
            mode,
            location = "",
            monthlyFee,
            daysPerWeek,
            bannerImage = "",
            description,
        } = req.body;

        if (!title || !subject || !classLevel || !mode || monthlyFee === undefined || !daysPerWeek || !description) {
            return res.status(400).json({ message: "All required tuition fields must be provided." });
        }

        if (!["Online", "Offline"].includes(mode)) {
            return res.status(400).json({ message: "Mode must be either 'Online' or 'Offline'." });
        }

        const { tuitions, users } = getCollections();
        const tutorDoc = await users.findOne({ email: req.user.email });
        const tutorPlan = tutorDoc?.plan || req.user.plan || "free";

        if (tutorPlan === "free") {
            const existingCount = await tuitions.countDocuments({ tutorEmail: req.user.email });
            if (existingCount >= 2) {
                return res.status(403).json({
                    message: "Free plan limit reached (maximum 2 tuition posts). Upgrade to Pro for unlimited posts.",
                    code: "FREE_PLAN_LIMIT_REACHED",
                });
            }
        }

        const newTuition = {
            title: title.trim(),
            subject: subject.trim(),
            classLevel: classLevel.trim(),
            mode,
            location: mode === "Offline" ? location.trim() : "Online Session",
            monthlyFee: Number(monthlyFee),
            daysPerWeek: Number(daysPerWeek),
            bannerImage: bannerImage.trim(),
            description: description.trim(),
            tutorName: tutorDoc?.name || req.user.name,
            tutorEmail: req.user.email,
            approvalStatus: "pending",
            isActive: true,
            createdAt: new Date(),
        };

        const result = await tuitions.insertOne(newTuition);
        return res.status(201).json({
            message: "Tuition submitted for admin approval.",
            tuition: { ...newTuition, _id: result.insertedId },
        });
    } catch (error) {
        next(error);
    }
}

export async function getMyTuitions(req, res, next) {
    try {
        const { tuitions } = getCollections();
        const list = await tuitions
            .find({ tutorEmail: req.user.email })
            .sort({ createdAt: -1 })
            .toArray();

        return res.status(200).json({ tuitions: list });
    } catch (error) {
        next(error);
    }
}

export async function updateTuition(req, res, next) {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            return res.status(400).json({ message: "Invalid tuition ID." });
        }

        const { tuitions } = getCollections();
        const existing = await tuitions.findOne({ _id: objectId });

        if (!existing) {
            return res.status(404).json({ message: "Tuition not found." });
        }

        if (existing.tutorEmail !== req.user.email && req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden: You do not own this tuition post." });
        }

        const allowedFields = [
            "title",
            "subject",
            "classLevel",
            "mode",
            "location",
            "monthlyFee",
            "daysPerWeek",
            "bannerImage",
            "description",
            "isActive",
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (field === "monthlyFee" || field === "daysPerWeek") {
                    updates[field] = Number(req.body[field]);
                } else if (field === "isActive") {
                    updates[field] = Boolean(req.body[field]);
                } else if (typeof req.body[field] === "string") {
                    updates[field] = req.body[field].trim();
                } else {
                    updates[field] = req.body[field];
                }
            }
        }

        const updated = await tuitions.findOneAndUpdate(
            { _id: objectId },
            { $set: updates },
            { returnDocument: "after" }
        );

        return res.status(200).json({
            message: "Tuition updated successfully.",
            tuition: updated,
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteTuition(req, res, next) {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            return res.status(400).json({ message: "Invalid tuition ID." });
        }

        const { tuitions, applications } = getCollections();
        const existing = await tuitions.findOne({ _id: objectId });

        if (!existing) {
            return res.status(404).json({ message: "Tuition not found." });
        }

        if (existing.tutorEmail !== req.user.email && req.user.role !== "admin") {
            return res.status(403).json({ message: "Forbidden: You do not own this tuition post." });
        }

        await tuitions.deleteOne({ _id: objectId });
        await applications.deleteMany({ tuitionId: objectId.toString() });

        return res.status(200).json({ message: "Tuition post deleted." });
    } catch (error) {
        next(error);
    }
}

// Admin routes
export async function getAllTuitionsAdmin(req, res, next) {
    try {
        const { tuitions } = getCollections();
        const list = await tuitions.find({}).sort({ createdAt: -1 }).toArray();
        return res.status(200).json({ tuitions: list });
    } catch (error) {
        next(error);
    }
}

export async function moderateTuitionStatus(req, res, next) {
    try {
        const objectId = toObjectId(req.params.id);
        const { approvalStatus } = req.body;

        if (!objectId) {
            return res.status(400).json({ message: "Invalid tuition ID." });
        }

        if (!["pending", "approved", "rejected"].includes(approvalStatus)) {
            return res.status(400).json({ message: "Invalid approval status." });
        }

        const { tuitions } = getCollections();
        const updated = await tuitions.findOneAndUpdate(
            { _id: objectId },
            { $set: { approvalStatus } },
            { returnDocument: "after" }
        );

        if (!updated) {
            return res.status(404).json({ message: "Tuition post not found." });
        }

        return res.status(200).json({
            message: `Tuition marked as ${approvalStatus}.`,
            tuition: updated,
        });
    } catch (error) {
        next(error);
    }
}