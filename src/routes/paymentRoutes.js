import { Router } from "express";
import {
    createCheckoutSession,
    verifyCheckoutSession,
    getAllPaymentsAdmin,
} from "../controllers/paymentController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyAdmin } from "../middlewares/verifyRole.js";

const router = Router();

router.post("/create-checkout-session", verifyToken, createCheckoutSession);
router.post("/verify-session", verifyToken, verifyCheckoutSession);
router.get("/admin/all", verifyToken, verifyAdmin, getAllPaymentsAdmin);

export default router;