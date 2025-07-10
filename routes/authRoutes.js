
import express from "express";
import {
    registerUser,
    loginUser,
    getUserProfile,
    purchaseBook,
    likeBook,
} from "../controllers/userController.js"; 
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route pour creer un compte
router.post("/register", registerUser); 

// Route POST pour la connexion d'un utilisateur
router.post('/login', loginUser); 

// Route protégées pour le profil d'un utilisateur!!!
router.get("/profile", authenticateToken, getUserProfile);

// Route protégées pour achter un livre!!!
router.post("/purchase", authenticateToken, purchaseBook);

// Route protégées pour achter un livre!!!
router.post("/like", authenticateToken, likeBook);




export default router;
