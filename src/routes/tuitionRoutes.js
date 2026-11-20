import { Router } from "express";
import {
    getPublicTuitions,
    getTuitionById,
    createTuition,
    getMyTuitions,
    updateTuition,
    deleteTuition,
    getAllTuitionsAdmin,
    moderateTuitionStatus,
} from "../controllers/tuitionController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyTutor, verifyAdmin } from "../middlewares/verifyRole.js";

const router = Router();

// Public routes
router.get("/", getPublicTuitions);

// Tutor routes
router.get("/tutor/my", verifyToken, verifyTutor, getMyTuitions);
router.post("/", verifyToken, verifyTutor, createTuition);
router.patch("/:id", verifyToken, verifyTutor, updateTuition);
router.delete("/:id", verifyToken, verifyTutor, deleteTuition);

// Admin routes
router.get("/admin/all", verifyToken, verifyAdmin, getAllTuitionsAdmin);
router.patch("/:id/moderate", verifyToken, verifyAdmin, moderateTuitionStatus);

// Single tuition details (keep after static subpaths)
router.get("/:id", getTuitionById);

export default router;