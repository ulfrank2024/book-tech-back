import * as userModel from "../models/userModel.js";
import { getOrCreateCart, getCartItemsByCartId } from '../models/cartModel.js';
import bcrypt from "bcrypt"; 
import jwt from "jsonwebtoken";
import crypto from "crypto"; // Import crypto for token generation

/**
 * Crée un nouveau compte utilisateur.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const registerUser = async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    try {
        if (!first_name || !email || !password) {
            return res
                .status(400)
                .json({
                    message:
                        "Veuillez fournir un prénom, un email et un mot de passe.",
                });
        }
        if (password.length < 6) {
            return res
                .status(400)
                .json({
                    message:
                        "Le mot de passe doit contenir au moins 6 caractères.",
                });
        }
        const userRole = await userModel.findRoleByName("Utilisateur");
        if (!userRole) {
            console.error(
                "Le rôle 'Utilisateur' n'existe pas dans la base de données."
            );
            return res
                .status(500)
                .json({
                    message: "Configuration de rôle manquante sur le serveur.",
                });
        }
        const role_id = userRole.role_id;
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        const userData = {
            first_name,
            last_name: last_name || null,
            email,
            password_hash,
            role_id,
        };
        const newUser = await userModel.insertUser(userData);
        const { password_hash: omittedHash, ...userResponse } = newUser;

        res.status(201).json({
            message: "Compte utilisateur créé avec succès.",
            user: userResponse,
        });
    } catch (error) {
        console.error(
            "Erreur lors de l'enregistrement de l'utilisateur:",
            error.message
        );
        if (error.code === "23505") {
            return res
                .status(409)
                .json({
                    message:
                        "Cet email est déjà utilisé. Veuillez en choisir un autre.",
                });
        }
        if (error.code === "23503") {
            return res
                .status(400)
                .json({
                    message: "Erreur de rôle : le rôle spécifié n'existe pas.",
                });
        }
        if (error.code === "23502") {
            return res
                .status(400)
                .json({
                    message: `Un champ obligatoire est manquant: ${error.detail}`,
                });
        }

        res.status(500).json({
            message: "Erreur interne du serveur lors de la création du compte.",
        });
    }
};

/**
 * Connecte un utilisateur et renvoie un JWT.
 * @param {object} req - L'objet requête Express (doit contenir email et password dans le corps).
 * @param {object} res - L'objet réponse Express.
 */
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Validation des champs d'entrée
        if (!email || !password) {
            return res.status(400).json({ message: "Veuillez fournir un email et un mot de passe." });
        }

        // 2. Trouver l'utilisateur par email
        const user = await userModel.findUserByEmail(email);

        if (!user) {
            // Pour des raisons de sécurité, ne pas indiquer si c'est l'email ou le mot de passe qui est incorrect.
            return res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }

        // 3. Comparer le mot de passe fourni avec le hachage stocké
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect." });
        }

        // 4. Générer un JWT
        // Le payload du JWT contient des informations sur l'utilisateur que tu pourras utiliser
        // pour les autorisations (ex: ID utilisateur, rôle).
        const token = jwt.sign(
            {
                userId: user.user_id,
                roleId: user.role_id,
                roleName: user.role_name // Optionnel mais pratique
            },
            process.env.JWT_SECRET, // La clé secrète de ton .env
            { expiresIn: '1h' } // Le token expirera après 1 heure (à ajuster selon tes besoins)
        );

        // 5. Réponse de succès
        res.status(200).json({
            message: "Connexion réussie.",
            token: token,
            user: { // Renvoyer des infos utilisateur de base (sans le mot de passe haché)
                user_id: user.user_id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role_id: user.role_id,
                role_name: user.role_name
            }
        });

    } catch (error) {
        console.error("Erreur lors de la connexion de l'utilisateur:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la tentative de connexion." });
    }
};

/**
 * Gère la demande de réinitialisation de mot de passe.
 * Génère un jeton, le stocke et envoie un e-mail à l'utilisateur.
 * @param {object} req - L'objet requête Express (doit contenir email dans le corps).
 * @param {object} res - L'objet réponse Express.
 */
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await userModel.findUserByEmail(email);
        if (!user) {
            // Pour des raisons de sécurité, toujours renvoyer un succès même si l'email n'existe pas.
            return res.status(200).json({ message: "Si l'email existe, un lien de réinitialisation a été envoyé." });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetExpires = Date.now() + 3600000; // 1 heure

        await userModel.updateUserPasswordResetToken(user.user_id, resetToken, passwordResetExpires);

        // TODO: Envoyer l'e-mail avec le lien de réinitialisation
        // Le lien devrait ressembler à: `http://localhost:3000/reset-password/${resetToken}`
        console.log(`Lien de réinitialisation: http://localhost:3000/reset-password/${resetToken}`);
        // Ici, vous intégreriez un service d'envoi d'e-mails (ex: Nodemailer)

        res.status(200).json({ message: "Si l'email existe, un lien de réinitialisation a été envoyé." });

    } catch (error) {
        console.error("Erreur lors de la demande de réinitialisation de mot de passe:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la demande de réinitialisation." });
    }
};

/**
 * Réinitialise le mot de passe de l'utilisateur en utilisant un jeton.
 * @param {object} req - L'objet requête Express (doit contenir resetToken dans les params et newPassword dans le corps).
 * @param {object} res - L'objet réponse Express.
 */
export const resetPassword = async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    try {
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caractères." });
        }

        const user = await userModel.findUserByPasswordResetToken(resetToken);

        if (!user || user.password_reset_expires < Date.now()) {
            return res.status(400).json({ message: "Jeton de réinitialisation invalide ou expiré." });
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(newPassword, saltRounds);

        await userModel.updateUserPassword(user.user_id, password_hash);
        await userModel.clearUserPasswordResetToken(user.user_id); // Nettoyer le jeton après utilisation

        res.status(200).json({ message: "Mot de passe réinitialisé avec succès." });

    } catch (error) {
        console.error("Erreur lors de la réinitialisation du mot de passe:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la réinitialisation du mot de passe." });
    }
};

/**
 * Affiche le profil de l'utilisateur actuellement authentifié et ses livres associés.
 * @param {object} req - L'objet requête Express (doit avoir req.user attaché par le middleware d'auth).
 * @param {object} res - L'objet réponse Express.
 */
export const getUserProfile = async (req, res) => {
    const userId = req.user.userId;
    try {
        if (!userId) {
            return res.status(400).json({ message: "ID utilisateur non trouvé dans le token." });
        }
        // 1. Récupérer les informations de base de l'utilisateur
        const user = await userModel.findUserById(userId);
        if (!user) {
            return res.status(404).json({ message: "Profil utilisateur non trouvé." });
        }

        // 2. Récupérer les livres achetés par cet utilisateur
        const purchases = await userModel.findBooksByUserId(userId);

        // 3. Récupérer les livres favoris de l'utilisateur
        const favorites = await userModel.findFavoriteBooksByUserId(userId);

        // 4. Récupérer les articles du panier de l'utilisateur
        const cart = await getOrCreateCart(userId);
        const cartItems = await getCartItemsByCartId(cart.cart_id);

        // 5. Récupérer les citations aimées par l'utilisateur
        const quotes = await userModel.findLikedQuotesByUserId(userId);

        // 6. Récupérer l'historique des commandes de l'utilisateur
        const orderHistory = await userModel.findOrdersByUserId(userId);

        // 7. Renvoyer toutes les informations combinées
        res.status(200).json({
            message: "Profil utilisateur et données associées récupérés avec succès.",
            user: {
                ...user,
                purchases,
                favorites,
                cartItems,
                quotes,
                orderHistory
            }
        });
    } catch (error) {
        console.error("Erreur dans le contrôleur getUserProfile:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération du profil et des données associées." });
    }
};

/**
 * Permet à un utilisateur authentifié d' "acheter" (associer) un livre.
 * @param {object} req - L'objet requête Express. Doit contenir bookId dans le corps et req.user du JWT.
 * @param {object} res - L'objet réponse Express.
 */
export const purchaseBook = async (req, res) => {
    // L'ID de l'utilisateur provient du token JWT (authentifié)
    const userId = req.user.userId;
    // L'ID du livre provient du corps de la requête
    const { bookId } = req.body;

    try {
        // 1. Validation des entrées
        if (!bookId) {
            return res.status(400).json({ message: "L'ID du livre est requis pour l'achat." });
        }
        if (!userId) {
            // Normalement, cela ne devrait pas arriver si le middleware authenticateToken fonctionne
            return res.status(400).json({ message: "ID utilisateur non trouvé dans le token d'authentification." });
        }

        // 2. Vérifier si le livre existe réellement (optionnel mais recommandé pour la robustesse)
        // Pour cela, tu aurais besoin d'une fonction findBookById dans bookModel.js
        // import * => as bookModel from '../models/bookModel.js';
        // const bookExists = await bookModel.findBookById(bookId);
        // if (!bookExists) {
        //     return res.status(404).json({ message: "Livre non trouvé." });
        // }

        // 3. Ajouter le livre au compte de l'utilisateur
        const newEntry = await userModel.addUserBook(userId, bookId);

        res.status(201).json({
            message: "Livre ajouté à votre compte avec succès.",
            userBook: newEntry
        });

    } catch (error) {
        console.error("Erreur lors de l'achat du livre :", error.message);

        // Gérer le cas où le livre est déjà "acheté" par l'utilisateur (violation de la contrainte UNIQUE)
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({ message: "Vous possédez déjà ce livre." });
        }
        // Gérer le cas où le bookId n'est pas un UUID valide
        if (error.code === '22P02') {
             return res.status(400).json({ message: "ID de livre invalide." });
        }
        // Gérer le cas où le bookId ou userId référencé n'existe pas (violation de clé étrangère)
        if (error.code === '23503') {
             return res.status(400).json({ message: "ID de livre ou d'utilisateur introuvable." });
        }

        res.status(500).json({ message: "Erreur interne du serveur lors de l'achat du livre." });
    }
};
/**
 * Permet à un utilisateur authentifié de "liker" un livre.
 * @param {object} req - L'objet requête Express. Doit contenir bookId dans le corps et req.user du JWT.
 * @param {object} res - L'objet réponse Express.
 */
export const likeBook = async (req, res) => {
    const userId = req.user.userId;
    const { bookId } = req.body;

    try {
        if (!bookId || !userId) {
            return res.status(400).json({ message: "L'ID de l'utilisateur et du livre sont requis." });
        }

        // Optionnel: Vérifier si le livre existe (recommandé)
        // const bookExists = await bookModel.findBookById(bookId);
        // if (!bookExists) {
        //     return res.status(404).json({ message: "Livre non trouvé." });
        // }

        const newLike = await userModel.addBookLike(userId, bookId);
        res.status(201).json({
            message: "Livre liké avec succès !",
            like: newLike
        });

    } catch (error) {
        console.error("Erreur lors du like du livre :", error.message);
        if (error.code === '23505') { // Code d'erreur PostgreSQL pour violation de contrainte unique
            return res.status(409).json({ message: "Vous avez déjà liké ce livre." });
        }
        if (error.code === '22P02' || error.code === '23503') {
             return res.status(400).json({ message: "ID de livre ou d'utilisateur invalide." });
        }
        res.status(500).json({ message: "Erreur interne du serveur lors du like du livre." });
    }
};
