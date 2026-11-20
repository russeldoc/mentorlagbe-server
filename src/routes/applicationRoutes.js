import { Router } from "express";
import {
    createApplication,
    getStudentApplications,
    cancelPendingApplication,
    getTutorApplicants,
    updateApplicationStatus,
    toggleBookmark,
    getBookmarkedTuitions,
} from "../controllers/applicationController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyStudent, verifyTutor } from "../middlewares/verifyRole.js";

const router = Router();

// Student routes
router.post("/", verifyToken, verifyStudent, createApplication);
router.get("/student/my", verifyToken, verifyStudent, getStudentApplications);
router.delete("/:id", verifyToken, verifyStudent, cancelPendingApplication);
router.post("/bookmarks/toggle", verifyToken, verifyStudent, toggleBookmark);
router.get("/bookmarks/my", verifyToken, verifyStudent, getBookmarkedTuitions);

// Tutor routes
router.get("/tutor/applicants", verifyToken, verifyTutor, getTutorApplicants);
router.patch("/:id/status", verifyToken, verifyTutor, updateApplicationStatus);

export default router;