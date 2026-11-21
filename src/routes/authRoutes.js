import { Router } from "express";
import { registerUser, loginUser, getCurrentUser } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", verifyToken, getCurrentUser);

export default router;