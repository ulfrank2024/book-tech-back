// models/userModel.js
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
// Tu peux ajouter d'autres fonctions pour les utilisateurs ici (findUserByEmail, findUserById, etc.)
