import { Router } from "express";
import {
    getStudentStats,
    getTutorStats,
    getAdminStats,
} from "../controllers/statsController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyStudent, verifyTutor, verifyAdmin } from "../middlewares/verifyRole.js";

const router = Router();

router.get("/student", verifyToken, verifyStudent, getStudentStats);
router.get("/tutor", verifyToken, verifyTutor, getTutorStats);
router.get("/admin", verifyToken, verifyAdmin, getAdminStats);

export default router;