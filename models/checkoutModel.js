// models/checkoutModel.js
import pool from "../db/db.js";
// --- Fonctions pour ShippingAddresses (si applicable) ---
/**
 * Enregistre ou met à jour une adresse de livraison pour un utilisateur.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {object} addressData - Les données de l'adresse (address_line1, city, etc.).
 * @returns {Promise<object>} L'objet adresse créé ou mis à jour.
 */
export const saveShippingAddress = async (userId, addressData) => {
    const {
        address_line1,
        address_line2,
        city,
        province,
        postal_code,
        country,
        is_default = false,
    } = addressData;
    try {
        // Optionnel: Gérer la logique de 'is_default' pour s'assurer qu'une seule adresse est par défaut
        if (is_default) {
            await pool.query(
                `UPDATE ShippingAddresses SET is_default = FALSE WHERE user_id = $1;`,
                [userId]
            );
        }

        const result = await pool.query(
            `INSERT INTO ShippingAddresses (user_id, address_line1, address_line2, city, province, postal_code, country, is_default)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *;`,
            [
                userId,
                address_line1,
                address_line2,
                city,
                province,
                postal_code,
                country,
                is_default,
            ]
        );
        return result.rows[0];
    } catch (error) {
        console.error(
            "Erreur dans checkoutModel.saveShippingAddress:",
            error.message
        );
        throw error;
    }
};

/**
 * Récupère les adresses de livraison d'un utilisateur.
 * @param {string} userId - L'ID de l'utilisateur.
 * @returns {Promise<Array>} Un tableau d'objets adresse.
 */
export const getShippingAddresses = async (userId) => {
    try {
        const result = await pool.query(
            `SELECT * FROM ShippingAddresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC;`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error(
            "Erreur dans checkoutModel.getShippingAddresses:",
            error.message
        );
        throw error;
    }
};

// --- Fonctions pour les Paiements (simulé) ---

/**
 * Enregistre une tentative de paiement. Dans un vrai scénario, cela interagirait avec un PSP (Stripe, PayPal).
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {string} orderId - L'ID de la commande associée.
 * @param {string} paymentMethod - La méthode de paiement (ex: 'Credit Card', 'PayPal').
 * @param {number} amount - Le montant du paiement.
 * @param {string} status - Le statut du paiement (ex: 'Pending', 'Completed', 'Failed').
 * @returns {Promise<object>} L'objet paiement créé.
 */
export const createPaymentRecord = async (
    userId,
    orderId,
    paymentMethod,
    amount,
    status = "Pending",
    transactionId = null
) => {
    try {
        const result = await pool.query(
            `INSERT INTO Payments (user_id, order_id, payment_method, amount, status, transaction_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *;`,
            [userId, orderId, paymentMethod, amount, status, transactionId]
        );
        return result.rows[0];
    } catch (error) {
        console.error(
            "Erreur dans checkoutModel.createPaymentRecord:",
            error.message
        );
        throw error;
    }
};

/**
 * Met à jour le statut d'un paiement.
 * @param {string} paymentId - L'ID du paiement.
 * @param {string} newStatus - Le nouveau statut.
 * @param {string} [transactionId=null] - L'ID de transaction externe si disponible.
 * @returns {Promise<object | undefined>} L'objet paiement mis à jour.
 */
export const updatePaymentStatus = async (
    paymentId,
    newStatus,
    transactionId = null
) => {
    try {
        const result = await pool.query(
            `UPDATE Payments SET status = $2, transaction_id = COALESCE($3, transaction_id) WHERE payment_id = $1 RETURNING *;`,
            [paymentId, newStatus, transactionId]
        );
        return result.rows[0];
    } catch (error) {
        console.error(
            "Erreur dans checkoutModel.updatePaymentStatus:",
            error.message
        );
        throw error;
    }
};

// --- Fonctions pour les Commandes et Articles de Commande ---

/**
 * Crée une nouvelle commande vide dans la table Orders.
 * C'est une étape de préparation avant d'ajouter les articles et de la confirmer.
 * @param {string} userId - L'ID de l'utilisateur.
 * @param {number} totalAmount - Le montant total de la commande.
 * @param {string | null} shippingAddressId - L'ID de l'adresse de livraison (null si ebooks).
 * @returns {Promise<object>} L'objet commande créé.
 */
export const createOrder = async (
    userId,
    totalAmount,
    shippingAddressId = null
) => {
    try {
        const result = await pool.query(
            `INSERT INTO Orders (user_id, total_amount, shipping_address_id, status)
             VALUES ($1, $2, $3, 'Pending')
             RETURNING *;`,
            [userId, totalAmount, shippingAddressId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans checkoutModel.createOrder:", error.message);
        throw error;
    }
};

/**
 * Ajoute des articles à une commande spécifique.
 * @param {string} orderId - L'ID de la commande.
 * @param {Array<object>} items - Un tableau d'objets { book_id, quantity, price_at_purchase }.
 * @returns {Promise<Array>} Un tableau des articles de commande créés.
 */
export const addOrderItems = async (orderId, items) => {
    try {
        const client = await pool.connect();
        try {
            await client.query("BEGIN"); // Démarre une transaction

            const insertedItems = [];
            for (const item of items) {
                const result = await client.query(
                    `INSERT INTO OrderItems (order_id, book_id, quantity, price_at_purchase)
                     VALUES ($1, $2, $3, $4)
                     RETURNING *;`,
                    [
                        orderId,
                        item.book_id,
                        item.quantity,
                        item.price_at_purchase,
                    ]
                );
                insertedItems.push(result.rows[0]);
            }

            await client.query("COMMIT"); // Valide la transaction
            return insertedItems;
        } catch (error) {
            await client.query("ROLLBACK"); // Annule la transaction en cas d'erreur
            throw error;
        } finally {
            client.release(); // Libère le client de la pool
        }
    } catch (error) {
        console.error(
            "Erreur dans checkoutModel.addOrderItems:",
            error.message
        );
        throw error;
    }
};

/**
 * Met à jour le statut d'une commande.
 * @param {string} orderId - L'ID de la commande.
 * @param {string} newStatus - Le nouveau statut de la commande.
 * @param {string | null} [paymentId=null] - L'ID du paiement lié à la commande (optionnel).
 * @returns {Promise<object | undefined>} L'objet commande mis à jour.
 */
export const updateOrderStatus = async (
    orderId,
    newStatus,
    paymentId = null
) => {
    try {
        const result = await pool.query(
            `UPDATE Orders SET status = $2, payment_id = COALESCE($3, payment_id) WHERE order_id = $1 RETURNING *;`,
            [orderId, newStatus, paymentId]
        );
        return result.rows[0];
    } catch (error) {
        console.error(
            "Erreur dans checkoutModel.updateOrderStatus:",
            error.message
        );
        throw error;
    }
};

/**
 * Récupère une commande par son ID (utilisé pour la session de checkout).
 * @param {string} orderId - L'ID de la commande.
 * @returns {Promise<object | undefined>} L'objet commande.
 */
export const getOrderById = async (orderId) => {
    try {
        const result = await pool.query(
            `SELECT * FROM Orders WHERE order_id = $1;`,
            [orderId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans checkoutModel.getOrderById:", error.message);
        throw error;
    }
};
