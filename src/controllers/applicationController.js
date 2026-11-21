import { getCollections, toObjectId } from "../config/db.js";

export async function createApplication(req, res, next) {
    try {
        const { tuitionId, studentPhone, preferredSchedule, studentNote = "" } = req.body;

        if (!tuitionId || !studentPhone || !preferredSchedule) {
            return res.status(400).json({
                message: "tuitionId, studentPhone, and preferredSchedule are required.",
            });
        }

        const objectId = toObjectId(tuitionId);
        if (!objectId) {
            return res.status(400).json({ message: "Invalid tuition ID." });
        }

        const { tuitions, applications, users } = getCollections();

        // Enforce 1-application limit for Free-plan students
        const studentDoc = await users.findOne({ email: req.user.email });
        const isPro = studentDoc?.plan === "pro";

        if (!isPro) {
            const existingCount = await applications.countDocuments({
                studentEmail: req.user.email,
            });

            if (existingCount >= 1) {
                return res.status(403).json({
                    message:
                        "Free plan allows applying to only 1 tuition. Upgrade to Pro Student for unlimited tuition applications.",
                });
            }
        }

        const tuition = await tuitions.findOne({ _id: objectId });

        if (!tuition || tuition.approvalStatus !== "approved" || !tuition.isActive) {
            return res.status(400).json({ message: "This tuition is not currently open for applications." });
        }

        const duplicate = await applications.findOne({
            tuitionId: objectId.toString(),
            studentEmail: req.user.email,
        });

        if (duplicate) {
            return res.status(409).json({
                message: "You have already submitted an application for this tuition.",
            });
        }

        const newApplication = {
            tuitionId: objectId.toString(),
            tuitionTitle: tuition.title,
            subject: tuition.subject,
            monthlyFee: tuition.monthlyFee,
            tutorEmail: tuition.tutorEmail,
            studentName: req.user.name,
            studentEmail: req.user.email,
            studentPhone: studentPhone.trim(),
            preferredSchedule: preferredSchedule.trim(),
            studentNote: studentNote.trim(),
            status: "pending",
            appliedAt: new Date(),
        };

        const result = await applications.insertOne(newApplication);
        return res.status(201).json({
            message: "Application submitted successfully.",
            application: { ...newApplication, _id: result.insertedId },
        });
    } catch (error) {
        next(error);
    }
}

export async function getStudentApplications(req, res, next) {
    try {
        const { applications } = getCollections();
        const list = await applications
            .find({ studentEmail: req.user.email })
            .sort({ appliedAt: -1 })
            .toArray();

        return res.status(200).json({ applications: list });
    } catch (error) {
        next(error);
    }
}

export async function cancelPendingApplication(req, res, next) {
    try {
        const objectId = toObjectId(req.params.id);
        if (!objectId) {
            return res.status(400).json({ message: "Invalid application ID." });
        }

        const { applications } = getCollections();
        const appDoc = await applications.findOne({ _id: objectId });

        if (!appDoc) {
            return res.status(404).json({ message: "Application not found." });
        }

        if (appDoc.studentEmail !== req.user.email) {
            return res.status(403).json({ message: "Forbidden: Not your application." });
        }

        if (appDoc.status !== "pending") {
            return res.status(400).json({
                message: `Cannot cancel an application that is already ${appDoc.status}.`,
            });
        }

        await applications.deleteOne({ _id: objectId });
        return res.status(200).json({ message: "Pending application cancelled." });
    } catch (error) {
        next(error);
    }
}

export async function getTutorApplicants(req, res, next) {
    try {
        const { applications } = getCollections();
        const list = await applications
            .find({ tutorEmail: req.user.email })
            .sort({ appliedAt: -1 })
            .toArray();

        return res.status(200).json({ applicants: list });
    } catch (error) {
        next(error);
    }
}

export async function updateApplicationStatus(req, res, next) {
    try {
        const objectId = toObjectId(req.params.id);
        const { status } = req.body;

        if (!objectId) {
            return res.status(400).json({ message: "Invalid application ID." });
        }

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Status must be 'accepted' or 'rejected'." });
        }

        const { applications } = getCollections();
        const appDoc = await applications.findOne({ _id: objectId });

        if (!appDoc) {
            return res.status(404).json({ message: "Application not found." });
        }

        if (appDoc.tutorEmail !== req.user.email) {
            return res.status(403).json({ message: "Forbidden: You do not manage this tuition." });
        }

        const updated = await applications.findOneAndUpdate(
            { _id: objectId },
            { $set: { status } },
            { returnDocument: "after" }
        );

        return res.status(200).json({
            message: `Application ${status}.`,
            application: updated,
        });
    } catch (error) {
        next(error);
    }
}

// Optional Bookmarks for Students
export async function toggleBookmark(req, res, next) {
    try {
        const { tuitionId } = req.body;
        const objectId = toObjectId(tuitionId);
        if (!objectId) {
            return res.status(400).json({ message: "Invalid tuition ID." });
        }

        const { bookmarks, tuitions } = getCollections();
        const tuition = await tuitions.findOne({ _id: objectId });
        if (!tuition) {
            return res.status(404).json({ message: "Tuition not found." });
        }

        const existing = await bookmarks.findOne({
            studentEmail: req.user.email,
            tuitionId: objectId.toString(),
        });

        if (existing) {
            await bookmarks.deleteOne({ _id: existing._id });
            return res.status(200).json({ bookmarked: false, message: "Removed from saved tuitions." });
        }

        await bookmarks.insertOne({
            studentEmail: req.user.email,
            tuitionId: objectId.toString(),
            savedAt: new Date(),
        });

        return res.status(200).json({ bookmarked: true, message: "Saved to bookmarks." });
    } catch (error) {
        next(error);
    }
}

export async function getBookmarkedTuitions(req, res, next) {
    try {
        const { bookmarks, tuitions } = getCollections();
        const saved = await bookmarks.find({ studentEmail: req.user.email }).sort({ savedAt: -1 }).toArray();
        const ids = saved.map((b) => toObjectId(b.tuitionId)).filter(Boolean);

        const list = ids.length > 0 ? await tuitions.find({ _id: { $in: ids } }).toArray() : [];
        return res.status(200).json({ tuitions: list });
    } catch (error) {
        next(error);
    }
}