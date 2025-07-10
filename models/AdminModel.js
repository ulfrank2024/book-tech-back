// models/AdminModel.js
import pool from "../db/db.js";

/**
 * Récupère tous les utilisateurs avec leurs rôles.
 * @returns {Promise<Array>} Un tableau d'objets utilisateur avec leurs rôles.
 */
export const getAllUsersWithRoles = async () => {
    try {
        const result = await pool.query(
            `SELECT
                u.user_id,
                u.first_name,
                u.last_name,
                u.email,
                u.creation_date,
                u.is_active,
                r.role_id,
                r.role_name
             FROM Users u
             JOIN Roles r ON u.role_id = r.role_id
             ORDER BY u.creation_date DESC;`
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans AdminModel.getAllUsersWithRoles:", error.message);
        throw error;
    }
};

/**
 * Met à jour le rôle d'un utilisateur.
 * @param {string} userId - L'ID de l'utilisateur à mettre à jour.
 * @param {string} newRoleId - Le nouvel ID du rôle.
 * @returns {Promise<object | undefined>} L'utilisateur mis à jour, ou undefined si non trouvé.
 */
export const updateUserRole = async (userId, newRoleId) => {
    try {
        const result = await pool.query(
            `UPDATE Users SET role_id = $2 WHERE user_id = $1 RETURNING *;`,
            [userId, newRoleId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans AdminModel.updateUserRole:", error.message);
        throw error;
    }
};

/**
 * Récupère tous les rôles disponibles.
 * @returns {Promise<Array>} Un tableau d'objets rôle.
 */
export const getAllRoles = async () => {
    try {
        const result = await pool.query(`SELECT * FROM Roles ORDER BY role_name ASC;`);
        return result.rows;
    } catch (error) {
        console.error("Erreur dans AdminModel.getAllRoles:", error.message);
        throw error;
    }
};

/**
 * Récupère les statistiques globales du tableau de bord.
 * @returns {Promise<object>} Un objet contenant le nombre total de commandes, le revenu total et le nombre total de clients.
 */
export const getDashboardStats = async () => {
    try {
        const totalOrdersResult = await pool.query(`SELECT COUNT(*) FROM Orders;`);
        const totalRevenueResult = await pool.query(`SELECT COALESCE(SUM(total_amount), 0) FROM Orders WHERE status = 'Completed';`);
        const totalClientsResult = await pool.query(`SELECT COUNT(*) FROM Users;`);

        return {
            totalOrders: parseInt(totalOrdersResult.rows[0].count, 10),
            totalRevenue: parseFloat(totalRevenueResult.rows[0].coalesce),
            totalClients: parseInt(totalClientsResult.rows[0].count, 10),
        };
    } catch (error) {
        console.error("Erreur dans AdminModel.getDashboardStats:", error.message);
        throw error;
    }
};

/**
 * Récupère les données de ventes pour un graphique (par exemple, ventes par mois).
 * @returns {Promise<Array>} Un tableau d'objets avec les données de ventes.
 */
export const getSalesDataForChart = async () => {
    try {
        // Exemple: Ventes totales par mois pour l'année en cours
        const result = await pool.query(
            `SELECT
                TO_CHAR(order_date, 'YYYY-MM') AS sales_month,
                COALESCE(SUM(total_amount), 0) AS monthly_revenue
             FROM Orders
             WHERE status = 'Completed'
             GROUP BY sales_month
             ORDER BY sales_month ASC;`
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans AdminModel.getSalesDataForChart:", error.message);
        throw error;
    }
};

/**
 * Récupère les N livres les plus vendus.
 * @param {number} limit - Le nombre de livres à récupérer.
 * @returns {Promise<Array>} Un tableau des livres les plus vendus.
 */
export const getTopSellingBooks = async (limit = 5) => {
    try {
        const result = await pool.query(
            `SELECT
                b.book_id,
                b.title,
                b.author_name,
                b.cover_image_url,
                SUM(oi.quantity) AS total_sold_quantity
             FROM OrderItems oi
             JOIN Books b ON oi.book_id = b.book_id
             GROUP BY b.book_id, b.title, b.author_name, b.cover_image_url
             ORDER BY total_sold_quantity DESC
             LIMIT $1;`,
            [limit]
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans AdminModel.getTopSellingBooks:", error.message);
        throw error;
    }
};

/**
 * Récupère les N dernières commandes.
 * @param {number} limit - Le nombre de commandes à récupérer.
 * @returns {Promise<Array>} Un tableau des commandes récentes.
 */
export const getRecentOrders = async (limit = 5) => {
    try {
        const result = await pool.query(
            `SELECT
                o.order_id,
                o.total_amount,
                o.order_date,
                o.status,
                u.first_name,
                u.last_name,
                u.email
             FROM Orders o
             JOIN Users u ON o.user_id = u.user_id
             ORDER BY o.order_date DESC
             LIMIT $1;`,
            [limit]
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans AdminModel.getRecentOrders:", error.message);
        throw error;
    }
};

/**
 * Récupère tous les livres avec pagination.
 * @param {number} page - Le numéro de page (commence à 1).
 * @param {number} limit - Le nombre de livres par page.
 * @returns {Promise<object>} Un objet contenant les livres et le nombre total de livres.
 */
export const getAllBooksAdmin = async (page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;
        const booksResult = await pool.query(
            `SELECT b.*, bc.category_name FROM Books b JOIN BookCategories bc ON b.category_id = bc.category_id ORDER BY b.title ASC LIMIT $1 OFFSET $2;`,
            [limit, offset]
        );
        const totalBooksResult = await pool.query(`SELECT COUNT(*) FROM Books;`);

        return {
            books: booksResult.rows,
            total: parseInt(totalBooksResult.rows[0].count, 10),
            page,
            limit,
        };
    } catch (error) {
        console.error("Erreur dans AdminModel.getAllBooksAdmin:", error.message);
        throw error;
    }
};

/**
 * Ajoute un nouveau livre.
 * @param {object} bookData - Les données du livre à ajouter.
 * @returns {Promise<object>} Le livre ajouté.
 */
export const addBook = async (bookData) => {
    const { title, author_name, category_id, price, description, cover_image_url, book_file_url, availability, rating, format, file_size_mb } = bookData;
    try {
        const result = await pool.query(
            `INSERT INTO Books (title, author_name, category_id, price, description, cover_image_url, book_file_url, availability, rating, format, file_size_mb)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;`,
            [title, author_name, category_id, price, description, cover_image_url, book_file_url, availability, rating, format, file_size_mb]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans AdminModel.addBook:", error.message);
        throw error;
    }
};

/**
 * Récupère un livre par son ID.
 * @param {string} bookId - L'ID du livre.
 * @returns {Promise<object | undefined>} Le livre trouvé.
 */
export const getBookByIdAdmin = async (bookId) => {
    try {
        const result = await pool.query(
            `SELECT b.*, bc.category_name FROM Books b JOIN BookCategories bc ON b.category_id = bc.category_id WHERE b.book_id = $1;`,
            [bookId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans AdminModel.getBookByIdAdmin:", error.message);
        throw error;
    }
};

/**
 * Met à jour un livre existant.
 * @param {string} bookId - L'ID du livre à mettre à jour.
 * @param {object} bookData - Les données du livre à mettre à jour.
 * @returns {Promise<object | undefined>} Le livre mis à jour.
 */
export const updateBookAdmin = async (bookId, bookData) => {
    const fields = [];
    const values = [bookId];
    let paramIndex = 2;
    for (const key in bookData) {
        if (bookData.hasOwnProperty(key)) {
            fields.push(`${key} = ${paramIndex}`);
            values.push(bookData[key]);
            paramIndex++;
        }
    }
    if (fields.length === 0) return undefined;

    try {
        const result = await pool.query(
            `UPDATE Books SET ${fields.join(', ')} WHERE book_id = $1 RETURNING *;`,
            values
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans AdminModel.updateBookAdmin:", error.message);
        throw error;
    }
};

/**
 * Supprime un livre.
 * @param {string} bookId - L'ID du livre à supprimer.
 * @returns {Promise<number>} Le nombre de lignes supprimées.
 */
export const deleteBookAdmin = async (bookId) => {
    try {
        const result = await pool.query(`DELETE FROM Books WHERE book_id = $1;`, [bookId]);
        return result.rowCount;
    } catch (error) {
        console.error("Erreur dans AdminModel.deleteBookAdmin:", error.message);
        throw error;
    }
};

/**
 * Recherche des livres par titre ou auteur.
 * @param {string} query - Le terme de recherche.
 * @returns {Promise<Array>} Les livres correspondants.
 */
export const searchBooksAdmin = async (query) => {
    try {
        const result = await pool.query(
            `SELECT b.*, bc.category_name FROM Books b JOIN BookCategories bc ON b.category_id = bc.category_id WHERE b.title ILIKE $1 OR b.author_name ILIKE $1 ORDER BY b.title ASC;`,
            [`%${query}%`]
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans AdminModel.searchBooksAdmin:", error.message);
        throw error;
    }
};

/**
 * Récupère les statistiques de vente pour un ebook spécifique.
 * @param {string} bookId - L'ID de l'ebook.
 * @returns {Promise<object>} Les statistiques de vente de l'ebook.
 */
export const getBookSalesStats = async (bookId) => {
    try {
        const totalSoldQuantityResult = await pool.query(
            `SELECT COALESCE(SUM(quantity), 0) FROM OrderItems WHERE book_id = $1;`,
            [bookId]
        );
        const totalRevenueResult = await pool.query(
            `SELECT COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) FROM OrderItems oi WHERE oi.book_id = $1;`,
            [bookId]
        );

        return {
            bookId,
            totalSoldQuantity: parseInt(totalSoldQuantityResult.rows[0].coalesce, 10),
            totalRevenue: parseFloat(totalRevenueResult.rows[0].coalesce),
        };
    } catch (error) {
        console.error("Erreur dans AdminModel.getBookSalesStats:", error.message);
        throw error;
    }
};

/**
 * Récupère toutes les commandes avec pagination.
 * @param {number} page - Le numéro de page (commence à 1).
 * @param {number} limit - Le nombre de commandes par page.
 * @returns {Promise<object>} Un objet contenant les commandes et le nombre total de commandes.
 */
export const getAllOrdersAdmin = async (page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;
        const ordersResult = await pool.query(
            `SELECT o.*, u.first_name, u.last_name, u.email
             FROM Orders o
             JOIN Users u ON o.user_id = u.user_id
             ORDER BY o.order_date DESC
             LIMIT $1 OFFSET $2;`,
            [limit, offset]
        );
        const totalOrdersResult = await pool.query(`SELECT COUNT(*) FROM Orders;`);

        return {
            orders: ordersResult.rows,
            total: parseInt(totalOrdersResult.rows[0].count, 10),
            page,
            limit,
        };
    } catch (error) {
        console.error("Erreur dans AdminModel.getAllOrdersAdmin:", error.message);
        throw error;
    }
};

/**
 * Récupère les détails d'une commande spécifique, y compris ses articles.
 * @param {string} orderId - L'ID de la commande.
 * @returns {Promise<object | undefined>} La commande avec ses articles.
 */
export const getOrderDetailsAdmin = async (orderId) => {
    try {
        const orderResult = await pool.query(
            `SELECT o.*, u.first_name, u.last_name, u.email
             FROM Orders o
             JOIN Users u ON o.user_id = u.user_id
             WHERE o.order_id = $1;`,
            [orderId]
        );
        const order = orderResult.rows[0];

        if (order) {
            const itemsResult = await pool.query(
                `SELECT oi.*, b.title, b.author_name, b.cover_image_url
                 FROM OrderItems oi
                 JOIN Books b ON oi.book_id = b.book_id
                 WHERE oi.order_id = $1;`,
                [orderId]
            );
            order.items = itemsResult.rows;
        }
        return order;
    } catch (error) {
        console.error("Erreur dans AdminModel.getOrderDetailsAdmin:", error.message);
        throw error;
    }
};

/**
 * Met à jour le statut d'une commande.
 * @param {string} orderId - L'ID de la commande.
 * @param {string} newStatus - Le nouveau statut de la commande.
 * @returns {Promise<object | undefined>} La commande mise à jour.
 */
export const updateOrderStatusAdmin = async (orderId, newStatus) => {
    try {
        const result = await pool.query(
            `UPDATE Orders SET status = $2 WHERE order_id = $1 RETURNING *;`,
            [orderId, newStatus]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans AdminModel.updateOrderStatusAdmin:", error.message);
        throw error;
    }
};

/**
 * Récupère toutes les commandes pour l'exportation (sans pagination).
 * @returns {Promise<Array>} Un tableau de toutes les commandes.
 */
export const getAllOrdersForExport = async () => {
    try {
        const result = await pool.query(
            `SELECT
                o.order_id,
                o.user_id,
                u.first_name AS user_first_name,
                u.last_name AS user_last_name,
                u.email AS user_email,
                o.total_amount,
                o.order_date,
                o.status,
                sa.address_line1, sa.city, sa.province, sa.postal_code, sa.country
             FROM Orders o
             JOIN Users u ON o.user_id = u.user_id
             LEFT JOIN ShippingAddresses sa ON o.shipping_address_id = sa.address_id
             ORDER BY o.order_date DESC;`
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans AdminModel.getAllOrdersForExport:", error.message);
        throw error;
    }
};

/**
 * Récupère les statistiques globales des commandes.
 * @returns {Promise<object>} Un objet contenant le nombre total de commandes, le revenu total et le nombre de commandes par statut.
 */
export const getOrderStats = async () => {
    try {
        const totalOrdersResult = await pool.query(`SELECT COUNT(*) FROM Orders;`);
        const totalRevenueResult = await pool.query(`SELECT COALESCE(SUM(total_amount), 0) FROM Orders WHERE status = 'Completed';`);
        const ordersByStatusResult = await pool.query(
            `SELECT status, COUNT(*) FROM Orders GROUP BY status;`
        );

        const stats = {
            totalOrders: parseInt(totalOrdersResult.rows[0].count, 10),
            totalRevenue: parseFloat(totalRevenueResult.rows[0].coalesce),
            ordersByStatus: ordersByStatusResult.rows.reduce((acc, row) => {
                acc[row.status] = parseInt(row.count, 10);
                return acc;
            }, {}),
        };
        return stats;
    } catch (error) {
        console.error("Erreur dans AdminModel.getOrderStats:", error.message);
        throw error;
    }
};

/**
 * Récupère tous les clients (utilisateurs) avec pagination.
 * @param {number} page - Le numéro de page (commence à 1).
 * @param {number} limit - Le nombre de clients par page.
 * @returns {Promise<object>} Un objet contenant les clients et le nombre total de clients.
 */
export const getAllClientsAdmin = async (page = 1, limit = 10) => {
    try {
        const offset = (page - 1) * limit;
        const clientsResult = await pool.query(
            `SELECT u.*, r.role_name FROM Users u JOIN Roles r ON u.role_id = r.role_id ORDER BY u.creation_date DESC LIMIT $1 OFFSET $2;`,
            [limit, offset]
        );
        const totalClientsResult = await pool.query(`SELECT COUNT(*) FROM Users;`);

        return {
            clients: clientsResult.rows,
            total: parseInt(totalClientsResult.rows[0].count, 10),
            page,
            limit,
        };
    } catch (error) {
        console.error("Erreur dans AdminModel.getAllClientsAdmin:", error.message);
        throw error;
    }
};

/**
 * Récupère les détails d'un client spécifique.
 * @param {string} userId - L'ID du client.
 * @returns {Promise<object | undefined>} Le client trouvé.
 */
export const getClientDetailsAdmin = async (userId) => {
    try {
        const result = await pool.query(
            `SELECT u.*, r.role_name FROM Users u JOIN Roles r ON u.role_id = r.role_id WHERE u.user_id = $1;`,
            [userId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans AdminModel.getClientDetailsAdmin:", error.message);
        throw error;
    }
};

/**
 * Met à jour les informations d'un client existant.
 * @param {string} userId - L'ID du client à mettre à jour.
 * @param {object} clientData - Les données du client à mettre à jour.
 * @returns {Promise<object | undefined>} Le client mis à jour.
 */
export const updateClientAdmin = async (userId, clientData) => {
    const fields = [];
    const values = [userId];
    let paramIndex = 2;
    for (const key in clientData) {
        if (clientData.hasOwnProperty(key) && key !== 'user_id' && key !== 'password_hash' && key !== 'creation_date') {
            fields.push(`${key} = ${paramIndex}`);
            values.push(clientData[key]);
            paramIndex++;
        }
    }
    if (fields.length === 0) return undefined;

    try {
        const result = await pool.query(
            `UPDATE Users SET ${fields.join(', ')} WHERE user_id = $1 RETURNING *;`,
            values
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans AdminModel.updateClientAdmin:", error.message);
        throw error;
    }
};

/**
 * Désactive le compte d'un client.
 * @param {string} userId - L'ID du client à désactiver.
 * @returns {Promise<object | undefined>} Le client désactivé.
 */
export const deactivateClientAccount = async (userId) => {
    try {
        const result = await pool.query(
            `UPDATE Users SET is_active = FALSE WHERE user_id = $1 RETURNING *;`,
            [userId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans AdminModel.deactivateClientAccount:", error.message);
        throw error;
    }
};

/**
 * Recherche des clients par nom ou email.
 * @param {string} query - Le terme de recherche.
 * @returns {Promise<Array>} Les clients correspondants.
 */
export const searchClientsAdmin = async (query) => {
    try {
        const result = await pool.query(
            `SELECT u.*, r.role_name FROM Users u JOIN Roles r ON u.role_id = r.role_id WHERE u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1 ORDER BY u.first_name ASC;`,
            [`%${query}%`]
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans AdminModel.searchClientsAdmin:", error.message);
        throw error;
    }
};

/**
 * Récupère toutes les commandes d'un client spécifique.
 * @param {string} userId - L'ID du client.
 * @returns {Promise<Array>} Un tableau des commandes du client.
 */
export const getClientOrders = async (userId) => {
    try {
        const result = await pool.query(
            `SELECT o.* FROM Orders o WHERE o.user_id = $1 ORDER BY o.order_date DESC;`,
            [userId]
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans AdminModel.getClientOrders:", error.message);
        throw error;
    }
};

/**
 * Fonction placeholder pour l'envoi d'email.
 * Dans une application réelle, cela utiliserait un service d'envoi d'emails (SendGrid, Nodemailer, etc.).
 * @param {string} email - L'adresse email du destinataire.
 * @param {string} subject - Le sujet de l'email.
 * @param {string} body - Le corps de l'email.
 * @returns {Promise<boolean>} True si l'email a été "envoyé" (simulé), false sinon.
 */
export const sendEmailToClient = async (email, subject, body) => {
    console.log(`Simulating email send to ${email} with subject: ${subject} and body: ${body}`);
    // Ici, vous intégreriez votre logique d'envoi d'email réelle
    return true; // Simule le succès
};

/**
 * Génère un rapport des ventes filtrable par période.
 * @param {string} startDate - Date de début (format YYYY-MM-DD).
 * @param {string} endDate - Date de fin (format YYYY-MM-DD).
 * @returns {Promise<Array>} Un tableau d'objets représentant les ventes par jour/mois.
 */
export const getSalesReport = async (startDate, endDate) => {
    try {
        const result = await pool.query(
            `SELECT
                DATE_TRUNC('day', order_date) AS sale_date,
                SUM(total_amount) AS daily_revenue,
                COUNT(order_id) AS daily_orders
             FROM Orders
             WHERE order_date >= $1 AND order_date <= $2 AND status = 'Completed'
             GROUP BY sale_date
             ORDER BY sale_date ASC;`,
            [startDate, endDate]
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans AdminModel.getSalesReport:", error.message);
        throw error;
    }
};

/**
 * Génère un rapport des ventes par catégorie de livre.
 * @returns {Promise<Array>} Un tableau d'objets représentant les ventes par catégorie.
 */
export const getSalesByCategoryReport = async () => {
    try {
        const result = await pool.query(
            `SELECT
                bc.category_name,
                SUM(oi.quantity * oi.price_at_purchase) AS category_revenue,
                COUNT(DISTINCT oi.order_id) AS total_orders_in_category,
                SUM(oi.quantity) AS total_books_sold_in_category
             FROM OrderItems oi
             JOIN Books b ON oi.book_id = b.book_id
             JOIN BookCategories bc ON b.category_id = bc.category_id
             JOIN Orders o ON oi.order_id = o.order_id
             WHERE o.status = 'Completed'
             GROUP BY bc.category_name
             ORDER BY category_revenue DESC;`
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans AdminModel.getSalesByCategoryReport:", error.message);
        throw error;
    }
};

/**
 * Génère un rapport sur les méthodes de paiement utilisées.
 * @returns {Promise<Array>} Un tableau d'objets représentant les paiements par méthode.
 */
export const getPaymentMethodsReport = async () => {
    try {
        const result = await pool.query(
            `SELECT
                payment_method,
                COUNT(payment_id) AS total_transactions,
                SUM(amount) AS total_amount_processed
             FROM Payments
             WHERE status = 'Completed'
             GROUP BY payment_method
             ORDER BY total_amount_processed DESC;`
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans AdminModel.getPaymentMethodsReport:", error.message);
        throw error;
    }
};

/**
 * Calcule le taux de conversion (nombre de commandes complétées / nombre d'utilisateurs enregistrés).
 * @returns {Promise<object>} Un objet contenant le taux de conversion et les données brutes.
 */
export const getConversionRateReport = async () => {
    try {
        const totalUsersResult = await pool.query(`SELECT COUNT(*) FROM Users;`);
        const completedOrdersResult = await pool.query(`SELECT COUNT(*) FROM Orders WHERE status = 'Completed';`);

        const totalUsers = parseInt(totalUsersResult.rows[0].count, 10);
        const completedOrders = parseInt(completedOrdersResult.rows[0].count, 10);

        const conversionRate = totalUsers > 0 ? (completedOrders / totalUsers) * 100 : 0;

        return {
            totalUsers,
            completedOrders,
            conversionRate: parseFloat(conversionRate.toFixed(2)),
        };
    } catch (error) {
        console.error("Erreur dans AdminModel.getConversionRateReport:", error.message);
        throw error;
    }
};

/**
 * Fonction générique pour récupérer des données pour l'exportation.
 * @param {string} reportType - Le type de rapport à exporter (ex: 'sales', 'users', 'orders').
 * @param {object} filters - Les filtres à appliquer au rapport.
 * @returns {Promise<Array>} Les données brutes du rapport.
 */
export const getExportData = async (reportType, filters = {}) => {
    try {
        switch (reportType) {
            case 'sales':
                // Réutilise la fonction existante ou une version plus détaillée
                return getSalesReport(filters.startDate, filters.endDate);
            case 'categories':
                return getSalesByCategoryReport();
            case 'payments':
                return getPaymentMethodsReport();
            case 'users':
                // Réutilise getAllClientsAdmin mais sans pagination
                const allUsersResult = await pool.query(
                    `SELECT u.*, r.role_name FROM Users u JOIN Roles r ON u.role_id = r.role_id ORDER BY u.creation_date DESC;`
                );
                return allUsersResult.rows;
            case 'orders':
                // Réutilise getAllOrdersForExport
                return getAllOrdersForExport();
            case 'books':
                // Récupère tous les livres sans pagination
                const allBooksResult = await pool.query(
                    `SELECT b.*, bc.category_name FROM Books b JOIN BookCategories bc ON b.category_id = bc.category_id ORDER BY b.title ASC;`
                );
                return allBooksResult.rows;
            default:
                throw new Error(`Type de rapport inconnu pour l'exportation : ${reportType}`);
        }
    } catch (error) {
        console.error("Erreur dans AdminModel.getExportData:", error.message);
        throw error;
    }
};

/**
 * Récupère les détails nécessaires pour générer une facture.
 * @param {string} orderId - L'ID de la commande.
 * @returns {Promise<object | undefined>} Les détails de la commande avec les articles et les informations utilisateur.
 */
export const getInvoiceDetails = async (orderId) => {
    try {
        // Réutilise la fonction existante pour obtenir les détails de la commande avec les articles
        const order = await getOrderDetailsAdmin(orderId);
        if (!order) {
            return undefined;
        }

        // Récupère les informations de l'adresse de livraison si disponible
        let shippingAddress = null;
        if (order.shipping_address_id) {
            const addressResult = await pool.query(
                `SELECT * FROM ShippingAddresses WHERE address_id = $1;`,
                [order.shipping_address_id]
            );
            shippingAddress = addressResult.rows[0];
        }

        // Récupère les informations de paiement si disponible
        let paymentDetails = null;
        if (order.payment_id) {
            const paymentResult = await pool.query(
                `SELECT * FROM Payments WHERE payment_id = $1;`,
                [order.payment_id]
            );
            paymentDetails = paymentResult.rows[0];
        }

        return { ...order, shippingAddress, paymentDetails };
    } catch (error) {
        console.error("Erreur dans AdminModel.getInvoiceDetails:", error.message);
        throw error;
    }
};

/**
 * Enregistre une activité dans le journal d'activité.
 * @param {string} userId - L'ID de l'utilisateur qui a effectué l'action (peut être null pour les actions système).
 * @param {string} activityType - Le type d'activité (ex: 'BOOK_ADDED', 'USER_UPDATED', 'ORDER_STATUS_CHANGED').
 * @param {string} description - Une description détaillée de l'activité.
 * @param {object} details - Un objet JSON contenant des détails supplémentaires (ex: { bookId: 'abc', oldStatus: 'pending' }).
 */
export const logActivity = async (userId, activityType, description, details = {}) => {
    try {
        await pool.query(
            `INSERT INTO ActivityLogs (user_id, activity_type, description, details)
             VALUES ($1, $2, $3, $4);`,
            [userId, activityType, description, JSON.stringify(details)]
        );
    } catch (error) {
        console.error("Erreur dans AdminModel.logActivity:", error.message);
        // Ne pas propager l'erreur pour ne pas bloquer l'opération principale
    }
};

/**
 * Récupère toutes les entrées du journal d'activité avec pagination.
 * @param {number} page - Le numéro de page (commence à 1).
 * @param {number} limit - Le nombre d'entrées par page.
 * @returns {Promise<object>} Un objet contenant les logs et le nombre total d'entrées.
 */
export const getActivityLogs = async (page = 1, limit = 20) => {
    try {
        const offset = (page - 1) * limit;
        const logsResult = await pool.query(
            `SELECT al.*, u.email AS user_email
             FROM ActivityLogs al
             LEFT JOIN Users u ON al.user_id = u.user_id
             ORDER BY al.timestamp DESC
             LIMIT $1 OFFSET $2;`,
            [limit, offset]
        );
        const totalLogsResult = await pool.query(`SELECT COUNT(*) FROM ActivityLogs;`);

        return {
            logs: logsResult.rows,
            total: parseInt(totalLogsResult.rows[0].count, 10),
            page,
            limit,
        };
    } catch (error) {
        console.error("Erreur dans AdminModel.getActivityLogs:", error.message);
        throw error;
    }
};
