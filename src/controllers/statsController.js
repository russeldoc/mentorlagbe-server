import { getCollections } from "../config/db.js";

export async function getStudentStats(req, res, next) {
    try {
        const { applications, users } = getCollections();
        const [totalApplied, acceptedCount, pendingCount, userDoc] = await Promise.all([
            applications.countDocuments({ studentEmail: req.user.email }),
            applications.countDocuments({ studentEmail: req.user.email, status: "accepted" }),
            applications.countDocuments({ studentEmail: req.user.email, status: "pending" }),
            users.findOne({ email: req.user.email }),
        ]);

        return res.status(200).json({
            stats: {
                totalApplied,
                acceptedApplications: acceptedCount,
                pendingApplications: pendingCount,
                plan: userDoc?.plan || req.user.plan || "free",
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function getTutorStats(req, res, next) {
    try {
        const { tuitions, applications, users } = getCollections();
        const [totalPosted, activeApproved, totalApplicants, userDoc] = await Promise.all([
            tuitions.countDocuments({ tutorEmail: req.user.email }),
            tuitions.countDocuments({ tutorEmail: req.user.email, approvalStatus: "approved", isActive: true }),
            applications.countDocuments({ tutorEmail: req.user.email }),
            users.findOne({ email: req.user.email }),
        ]);

        return res.status(200).json({
            stats: {
                totalTuitionsPosted: totalPosted,
                activeApprovedTuitions: activeApproved,
                totalApplicantsReceived: totalApplicants,
                plan: userDoc?.plan || req.user.plan || "free",
            },
        });
    } catch (error) {
        next(error);
    }
}

export async function getAdminStats(req, res, next) {
    try {
        const { users, tuitions, payments } = getCollections();
        const [totalUsers, totalTutors, pendingTuitions, approvedTuitions, paidPayments] = await Promise.all([
            users.countDocuments({}),
            users.countDocuments({ role: "tutor" }),
            tuitions.countDocuments({ approvalStatus: "pending" }),
            tuitions.countDocuments({ approvalStatus: "approved" }),
            payments.find({ paymentStatus: "paid" }).toArray(),
        ]);

        const totalRevenue = paidPayments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        return res.status(200).json({
            stats: {
                totalUsers,
                totalTutors,
                pendingTuitions,
                approvedTuitions,
                totalRevenue,
            },
        });
    } catch (error) {
        next(error);
    }
}