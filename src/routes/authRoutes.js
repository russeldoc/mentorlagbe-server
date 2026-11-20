import { Router } from "express";
import { syncSessionAndIssueJwt, getCurrentUser } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = Router();

router.post("/jwt-sync", syncSessionAndIssueJwt);
router.get("/me", verifyToken, getCurrentUser);

export default router;