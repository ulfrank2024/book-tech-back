// models/cartModel.js
import pool from "../db/db.js";
/**
 * Récupère le panier d'un utilisateur. S'il n'existe pas, en crée un.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<object>} L'objet panier (cart) de l'utilisateur.
 */
export const getOrCreateCart = async (userId) => {
    try {
        let result = await pool.query(
            `SELECT cart_id FROM Carts WHERE user_id = $1;`,
            [userId]
        );

        let cart = result.rows[0];

        if (!cart) {
            // Si le panier n'existe pas, on le crée
            result = await pool.query(
                `INSERT INTO Carts (user_id) VALUES ($1) RETURNING cart_id;`,
                [userId]
            );
            cart = result.rows[0];
            console.log(`Nouveau panier créé pour l'utilisateur ${userId}`);
        }
        return cart;
    } catch (error) {
        console.error("Erreur dans cartModel.getOrCreateCart:", error.message);
        throw error;
    }
};

/**
 * Ajoute ou met à jour un livre dans le panier de l'utilisateur.
 * @param {string} cartId - L'ID du panier.
 * @param {string} bookId - L'ID du livre à ajouter.
 * @param {number} quantity - La quantité à ajouter/mettre à jour.
 * @returns {Promise<object>} L'article du panier mis à jour ou créé.
 */
export const addOrUpdateCartItem = async (cartId, bookId, quantity) => {
    try {
        // Vérifier si l'article existe déjà dans le panier
        const existingItem = await pool.query(
            `SELECT quantity FROM CartItems WHERE cart_id = $1 AND book_id = $2;`,
            [cartId, bookId]
        );

        if (existingItem.rows.length > 0) {
            // Si l'article existe, mettre à jour la quantité
            const updatedQuantity = existingItem.rows[0].quantity + quantity;
            const result = await pool.query(
                `UPDATE CartItems SET quantity = $3 WHERE cart_id = $1 AND book_id = $2 RETURNING *;`,
                [cartId, bookId, updatedQuantity]
            );
            return result.rows[0];
        } else {
            // Sinon, ajouter un nouvel article
            const result = await pool.query(
                `INSERT INTO CartItems (cart_id, book_id, quantity) VALUES ($1, $2, $3) RETURNING *;`,
                [cartId, bookId, quantity]
            );
            return result.rows[0];
        }
    } catch (error) {
        console.error(
            "Erreur dans cartModel.addOrUpdateCartItem:",
            error.message
        );
        throw error;
    }
};

/**
 * Récupère tous les articles d'un panier, avec les détails des livres.
 * @param {string} cartId - L'ID du panier.
 * @returns {Promise<Array>} Un tableau d'articles du panier avec les détails du livre.
 */
export const getCartItemsByCartId = async (cartId) => {
    try {
        const result = await pool.query(
            `SELECT
                ci.cart_item_id,
                ci.book_id,
                ci.quantity,
                ci.added_at,
                b.title,
                b.author_name,
                b.price,
                b.cover_image_url
             FROM CartItems ci
             JOIN Books b ON ci.book_id = b.book_id
             WHERE ci.cart_id = $1
             ORDER BY ci.added_at DESC;`,
            [cartId]
        );
        return result.rows;
    } catch (error) {
        console.error(
            "Erreur dans cartModel.getCartItemsByCartId:",
            error.message
        );
        throw error;
    }
};

// --- Fonctions à venir pour PUT et DELETE ---

/**
 * Met à jour la quantité d'un article spécifique dans le panier.
 * @param {string} cartId - L'ID du panier.
 * @param {string} bookId - L'ID du livre à mettre à jour.
 * @param {number} newQuantity - La nouvelle quantité.
 * @returns {Promise<object | undefined>} L'article du panier mis à jour, ou undefined si non trouvé.
 */
export const updateCartItemQuantity = async (cartId, bookId, newQuantity) => {
    try {
        if (newQuantity <= 0) {
            // Si la quantité est 0 ou moins, on retire l'article
            return await removeCartItem(cartId, bookId);
        }
        const result = await pool.query(
            `UPDATE CartItems SET quantity = $3 WHERE cart_id = $1 AND book_id = $2 RETURNING *;`,
            [cartId, bookId, newQuantity]
        );
        return result.rows[0];
    } catch (error) {
        console.error(
            "Erreur dans cartModel.updateCartItemQuantity:",
            error.message
        );
        throw error;
    }
};

/**
 * Retire un livre spécifique du panier.
 * @param {string} cartId - L'ID du panier.
 * @param {string} bookId - L'ID du livre à retirer.
 * @returns {Promise<boolean>} True si l'article a été retiré, false sinon.
 */
export const removeCartItem = async (cartId, bookId) => {
    try {
        const result = await pool.query(
            `DELETE FROM CartItems WHERE cart_id = $1 AND book_id = $2 RETURNING cart_item_id;`,
            [cartId, bookId]
        );
        return result.rowCount > 0;
    } catch (error) {
        console.error("Erreur dans cartModel.removeCartItem:", error.message);
        throw error;
    }
};
