import { Router } from "express";
import { updateProfile, getAllUsers, updateUserRole } from "../controllers/userController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyAdmin } from "../middlewares/verifyRole.js";

const router = Router();

router.patch("/profile", verifyToken, updateProfile);
router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.patch("/:id/role", verifyToken, verifyAdmin, updateUserRole);

export default router;