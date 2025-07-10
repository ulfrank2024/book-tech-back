// routes/cartRoutes.js
import express from "express";
import {
    getCartContent,
    addItemToCart,
    updateCartItem,
    deleteCartItem,
} from "../controllers/cartController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
const router = express.Router();
router.use(authenticateToken); 
router.get("/", getCartContent);
router.post("/items", addItemToCart); 
router.put("/items/:book_id", updateCartItem); 
router.delete("/items/:book_id", deleteCartItem);

export default router;
