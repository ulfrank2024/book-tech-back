// routes/checkoutRoutes.js
import express from "express";
import {
    setShippingInformation,
    setPaymentMethod,
    confirmOrder,
    getCheckoutSessionStatus,
} from "../controllers/checkoutController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Toutes les routes du checkout nécessitent une authentification
router.use(authenticateToken);

router.post("/shipping", setShippingInformation); // POST /api/checkout/shipping
router.post("/payment", setPaymentMethod); // POST /api/checkout/payment
router.post("/confirm", confirmOrder); // POST /api/checkout/confirm
router.get("/session", getCheckoutSessionStatus); // GET /api/checkout/session

export default router;
