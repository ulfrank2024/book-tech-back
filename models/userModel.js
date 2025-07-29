import pool from "../db/db.js";

/**
 * Insère un nouvel utilisateur dans la base de données.
 * @param {object} userData - Données de l'utilisateur (first_name, last_name, email, password_hash, role_id).
 * @returns {Promise<object>} L'utilisateur créé (sans le password_hash).
 */
export const insertUser = async (userData) => {
    const { first_name, last_name, email, password_hash, role_id } = userData;
    try {
        const result = await pool.query(
            `INSERT INTO Users (first_name, last_name, email, password_hash, role_id)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id, first_name, last_name, email, creation_date, is_active, role_id;`,
            [first_name, last_name, email, password_hash, role_id]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans userModel.insertUser:", error.message);
        throw error;
    }
};

/**
 * Récupère un rôle par son nom.
 * @param {string} roleName - Le nom du rôle (ex: 'Utilisateur', 'Admin').
 * @returns {Promise<object | undefined>} L'objet rôle trouvé, ou undefined.
 */
export const findRoleByName = async (roleName) => {
    try {
        const result = await pool.query(
            `SELECT role_id, role_name FROM Roles WHERE role_name ILIKE $1;`,
            [roleName]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans userModel.findRoleByName:", error.message);
        throw error;
    }
};

/**
 * Récupère un utilisateur par son adresse email.
 * Inclut le mot de passe haché et l'ID du rôle, nécessaires pour la connexion.
 * @param {string} email - L'adresse email de l'utilisateur.
 * @returns {Promise<object | undefined>} L'objet utilisateur trouvé, ou undefined si non trouvé.
 */
export const findUserByEmail = async (email) => {
    try {
        const result = await pool.query(
            `SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.password_hash,
                u.role_id,
                r.role_name -- Récupère aussi le nom du rôle pour le JWT ou la logique future
             FROM Users u
             JOIN Roles r ON u.role_id = r.role_id
             WHERE u.email = $1;`,
            [email]
        );
        return result.rows[0]; // Renvoie le premier utilisateur trouvé (l'email est unique)
    } catch (error) {
        console.error("Erreur dans userModel.findUserByEmail:", error.message);
        throw error;
    }
};
/**
 * Récupère un utilisateur par son ID.
 * N'inclut PAS le mot de passe haché pour des raisons de sécurité.
 * @param {string} userId - L'ID UUID de l'utilisateur.
 * @returns {Promise<object | undefined>} L'objet utilisateur trouvé, ou undefined si non trouvé.
 */
export const findUserById = async (userId) => {
    try {
        const result = await pool.query(
            `SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.creation_date,
                u.is_active,
                u.role_id,
                r.role_name
             FROM Users u
             JOIN Roles r ON u.role_id = r.role_id
             WHERE u.user_id = $1;`,
            [userId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans userModel.findUserById:", error.message);
        throw error;
    }
};

/**
 * Récupère un rôle par son ID.
 * @param {string} roleId - L'ID du rôle.
 * @returns {Promise<object | undefined>} L'objet rôle trouvé, ou undefined.
 */
export const findRoleById = async (roleId) => {
    try {
        const result = await pool.query(
            `SELECT role_id, role_name FROM Roles WHERE role_id = $1;`,
            [roleId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans userModel.findRoleById:", error.message);
        throw error;
    }
};

/**
 * Met à jour le jeton de réinitialisation de mot de passe et son expiration pour un utilisateur.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {string} token - Le jeton de réinitialisation.
 * @param {Date} expires - La date d'expiration du jeton.
 * @returns {Promise<object>} L'utilisateur mis à jour.
 */
export const updateUserPasswordResetToken = async (userId, token, expires) => {
    try {
        const result = await pool.query(
            `UPDATE Users
             SET password_reset_token = $1, password_reset_expires = TO_TIMESTAMP($2 / 1000)
             WHERE user_id = $3
             RETURNING *;`,
            [token, expires, userId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans userModel.updateUserPasswordResetToken:", error.message);
        throw error;
    }
};

/**
 * Trouve un utilisateur par son jeton de réinitialisation de mot de passe.
 * @param {string} token - Le jeton de réinitialisation.
 * @returns {Promise<object | undefined>} L'utilisateur trouvé, ou undefined si non trouvé ou expiré.
 */
export const findUserByPasswordResetToken = async (token) => {
    try {
        const result = await pool.query(
            `SELECT * FROM Users
             WHERE password_reset_token = $1 AND password_reset_expires > NOW();`,
            [token]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans userModel.findUserByPasswordResetToken:", error.message);
        throw error;
    }
};

/**
 * Met à jour le mot de passe haché d'un utilisateur.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {string} passwordHash - Le nouveau mot de passe haché.
 * @returns {Promise<object>} L'utilisateur mis à jour.
 */
export const updateUserPassword = async (userId, passwordHash) => {
    try {
        const result = await pool.query(
            `UPDATE Users
             SET password_hash = $1
             WHERE user_id = $2
             RETURNING *;`,
            [passwordHash, userId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans userModel.updateUserPassword:", error.message);
        throw error;
    }
};

/**
 * Efface le jeton de réinitialisation de mot de passe et son expiration pour un utilisateur.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<object>} L'utilisateur mis à jour.
 */
export const clearUserPasswordResetToken = async (userId) => {
    try {
        const result = await pool.query(
            `UPDATE Users
             SET password_reset_token = NULL, password_reset_expires = NULL
             WHERE user_id = $1
             RETURNING *;`,
            [userId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans userModel.clearUserPasswordResetToken:", error.message);
        throw error;
    }
};

/**
 * Récupère tous les livres associés à un utilisateur donné.
 * @param {string} userId - L'ID UUID de l'utilisateur.
 * @returns {Promise<Array>} Un tableau d'objets livre.
 */
export const findBooksByUserId = async (userId) => {
    try {
        const result = await pool.query(
            `SELECT
                b.book_id,
                b.title,
                b.author_name,
                b.price,
                b.cover_image_url,
                ub.purchase_date, -- Inclure la date d'achat/association
                bc.category_name AS category_name_string -- Récupérer le nom de la catégorie aussi
             FROM UserBooks ub
             JOIN Books b ON ub.book_id = b.book_id
             JOIN BookCategories bc ON b.category_id = bc.category_id
             WHERE ub.user_id = $1
             ORDER BY ub.purchase_date DESC;`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans userModel.findBooksByUserId:", error.message);
        throw error;
    }
};

/**
 * Associe un livre à un utilisateur dans la table UserBooks (simule un achat).
 * @param {string} userId - L'ID UUID de l'utilisateur qui "achète" le livre.
 * @param {string} bookId - L'ID UUID du livre à "acheter".
 * @returns {Promise<object>} L'entrée UserBook créée.
 */
export const addUserBook = async (userId, bookId) => {
    try {
        const result = await pool.query(
            `INSERT INTO UserBooks (user_id, book_id)
             VALUES ($1, $2)
             RETURNING user_book_id, user_id, book_id, purchase_date;`,
            [userId, bookId]
        );
        return result.rows[0]; // Renvoie l'entrée UserBook nouvellement créée
    } catch (error) {
        console.error("Erreur dans userModel.addUserBook:", error.message);
        throw error;
    }
};

/**
 * Enregistre un "like" pour un livre par un utilisateur.
 * @param {string} userId - L'ID UUID de l'utilisateur.
 * @param {string} bookId - L'ID UUID du livre "liké".
 * @returns {Promise<object>} L'entrée BookLike créée.
 */
export const addBookLike = async (userId, bookId) => {
    try {
        const result = await pool.query(
            `INSERT INTO booklikes (user_id, book_id)
             VALUES ($1, $2)
             RETURNING user_id, book_id, liked_at;`,
            [userId, bookId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans userModel.addBookLike:", error.message);
        throw error;
    }
};

/**
 * Compte le nombre total de likes qu'un utilisateur a faits.
 * @param {string} userId - L'ID UUID de l'utilisateur.
 * @returns {Promise<number>} Le nombre total de likes.
 */
export const countUserTotalLikes = async (userId) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) FROM booklikes WHERE user_id = $1;`,
            [userId]
        );
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        console.error("Erreur dans userModel.countUserTotalLikes:", error.message);
        throw error;
    }
};

/**
 * Récupère tous les livres favoris d'un utilisateur donné.
 * @param {string} userId - L'ID UUID de l'utilisateur.
 * @returns {Promise<Array>} Un tableau d'objets livre favoris.
 */
export const findFavoriteBooksByUserId = async (userId) => {
    try {
        const result = await pool.query(
            `SELECT
                b.book_id,
                b.title,
                b.author_name,
                b.cover_image_url,
                b.price
             FROM booklikes bl
             JOIN Books b ON bl.book_id = b.book_id
             WHERE bl.user_id = $1
             ORDER BY bl.liked_at DESC;`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans userModel.findFavoriteBooksByUserId:", error.message);
        throw error;
    }
};

/**
 * Récupère toutes les commandes d'un utilisateur donné avec les détails des articles.
 * @param {string} userId - L'ID UUID de l'utilisateur.
 * @returns {Promise<Array>} Un tableau d'objets commande avec les articles.
 */
export const findOrdersByUserId = async (userId) => {
    try {
        const ordersResult = await pool.query(
            `SELECT
                o.order_id,
                o.order_date,
                o.total_amount,
                o.status
             FROM Orders o
             WHERE o.user_id = $1
             ORDER BY o.order_date DESC;`,
            [userId]
        );

        // Pour chaque commande, récupérer les articles associés
        for (let order of ordersResult.rows) {
            const itemsResult = await pool.query(
                `SELECT
                    oi.quantity,
                    oi.price_at_purchase,
                    b.title,
                    b.author_name,
                    b.cover_image_url
                 FROM OrderItems oi
                 JOIN Books b ON oi.book_id = b.book_id
                 WHERE oi.order_id = $1;`,
                [order.order_id]
            );
            order.items = itemsResult.rows;
        }

        return ordersResult.rows;
    } catch (error) {
        console.error("Erreur dans userModel.findOrdersByUserId:", error.message);
        throw error;
    }
};

/**
 * Récupère toutes les citations aimées par un utilisateur donné.
 * @param {string} userId - L'ID UUID de l'utilisateur.
 * @returns {Promise<Array>} Un tableau d'objets citation aimées.
 */
export const findLikedQuotesByUserId = async (userId) => {
    try {
        const result = await pool.query(
            `SELECT
                q.quote_id,
                q.quote_text,
                q.author_name
             FROM quotelikes ql
             JOIN Quotes q ON ql.quote_id = q.quote_id
             WHERE ql.user_id = $1
             ORDER BY ql.liked_at DESC;`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans userModel.findLikedQuotesByUserId:", error.message);
        throw error;
    }
};
