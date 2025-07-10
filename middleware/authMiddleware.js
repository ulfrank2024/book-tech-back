// middleware/authMiddleware.js
import jwt from "jsonwebtoken"; // Assure-toi d'avoir bien installé 'jsonwebtoken' (npm install jsonwebtoken)

/**
 * Middleware pour authentifier un utilisateur via un JWT.
 * Attache les informations de l'utilisateur (userId, roleId, roleName) à req.user.
 */
export const authenticateToken = (req, res, next) => {
    // 1. Récupérer le token de l'en-tête Authorization
    const authHeader = req.headers["authorization"];
    // Le token est généralement au format "Bearer VOTRE_TOKEN_ICI"
    const token = authHeader && authHeader.split(" ")[1];

    // 2. Vérifier si un token est fourni
    if (token == null) {
        return res
            .status(401)
            .json({ message: "Accès refusé : Token non fourni." });
    }

    // 3. Vérifier la validité du token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Si le token est invalide, expiré, etc.
            console.error("Erreur de vérification JWT :", err.message);
            return res
                .status(403)
                .json({ message: "Accès refusé : Token invalide ou expiré." });
        }
        // Si le token est valide, les informations du payload (user_id, role_id, role_name)
        // sont décodées et attachées à l'objet `req.user`.
        req.user = user;
        // Passer au middleware ou au contrôleur suivant
        next();
    });
};

/**
 * Middleware pour autoriser l'accès uniquement aux utilisateurs ayant le rôle 'Admin'.
 * Doit être utilisé APRÈS authenticateToken.
 */
export const authorizeAdmin = async (req, res, next) => {
    // req.user est défini par le middleware authenticateToken
    if (!req.user || !req.user.roleName) {
        return res.status(403).json({ message: "Accès refusé : Informations de rôle manquantes." });
    }

    // Vérifier si le rôle de l'utilisateur est 'Admin'
    if (req.user.roleName !== 'Admin') {
        return res.status(403).json({ message: "Accès refusé : Seuls les administrateurs peuvent accéder à cette ressource." });
    }

    // Si l'utilisateur est un administrateur, passer à la fonction suivante
    next();
};
