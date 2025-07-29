import express from "express";
import {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
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

// Route pour la demande de réinitialisation de mot de passe
router.post('/forgot-password', forgotPassword);

// Route pour la réinitialisation effective du mot de passe
router.post('/reset-password/:resetToken', resetPassword);

// Route protégées pour le profil d'un utilisateur!!!
router.get("/profile", authenticateToken, getUserProfile);

// Route protégées pour achter un livre!!!
router.post("/purchase", authenticateToken, purchaseBook);

// Route protégées pour achter un livre!!!
router.post("/like", authenticateToken, likeBook);




export default router;