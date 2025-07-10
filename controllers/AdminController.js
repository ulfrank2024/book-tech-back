// controllers/AdminController.js
import * as AdminModel from "../models/AdminModel.js";
import * as userModel from "../models/userModel.js"; // Pour findUserById et findRoleByName

/**
 * Récupère la liste de tous les utilisateurs avec leurs rôles.
 * Nécessite une autorisation d'administrateur.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const getAllUsers = async (req, res) => {
    try {
        const users = await AdminModel.getAllUsersWithRoles();
        res.status(200).json(users);
    } catch (error) {
        console.error("Erreur dans AdminController.getAllUsers:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des utilisateurs." });
    }
};

/**
 * Met à jour le rôle d'un utilisateur spécifique.
 * Nécessite une autorisation d'administrateur.
 * @param {object} req - L'objet requête Express. Contient userId dans params et newRoleId dans body.
 * @param {object} res - L'objet réponse Express.
 */
export const updateUserRole = async (req, res) => {
    const { userId } = req.params;
    const { newRoleId } = req.body;

    try {
        if (!newRoleId) {
            return res.status(400).json({ message: "Le nouvel ID de rôle est requis." });
        }

        // Vérifier si l'utilisateur existe
        const userExists = await userModel.findUserById(userId);
        if (!userExists) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Vérifier si le rôle existe
        const roleExists = await userModel.findRoleById(newRoleId); // Supposons que findRoleById existe ou crée-le
        if (!roleExists) {
            return res.status(404).json({ message: "Rôle non trouvé." });
        }

        const updatedUser = await AdminModel.updateUserRole(userId, newRoleId);

        if (!updatedUser) {
            return res.status(404).json({ message: "Utilisateur non trouvé ou rôle inchangé." });
        }

        res.status(200).json({ message: "Rôle utilisateur mis à jour avec succès.", user: updatedUser });
    } catch (error) {
        console.error("Erreur dans AdminController.updateUserRole:", error.message);
        if (error.code === '22P02') { // Invalid UUID format
            return res.status(400).json({ message: "Format d'ID utilisateur ou de rôle invalide." });
        }
        res.status(500).json({ message: "Erreur interne du serveur lors de la mise à jour du rôle utilisateur." });
    }
};

/**
 * Récupère la liste de tous les rôles disponibles.
 * Nécessite une autorisation d'administrateur.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const getAllRoles = async (req, res) => {
    try {
        const roles = await AdminModel.getAllRoles();
        res.status(200).json(roles);
    } catch (error) {
        console.error("Erreur dans AdminController.getAllRoles:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des rôles." });
    }
};

/**
 * Récupère les statistiques globales pour le tableau de bord administrateur.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const getDashboardStats = async (req, res) => {
    try {
        const stats = await AdminModel.getDashboardStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error("Erreur dans AdminController.getDashboardStats:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des statistiques du tableau de bord." });
    }
};

/**
 * Récupère les données de ventes pour le graphique du tableau de bord.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const getSalesChartData = async (req, res) => {
    try {
        const salesData = await AdminModel.getSalesDataForChart();
        res.status(200).json(salesData);
    } catch (error) {
        console.error("Erreur dans AdminController.getSalesChartData:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des données de ventes." });
    }
};

/**
 * Récupère les livres les plus vendus pour le tableau de bord.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const getTopBooks = async (req, res) => {
    try {
        const topBooks = await AdminModel.getTopSellingBooks(); // Utilise la limite par défaut (5)
        res.status(200).json(topBooks);
    } catch (error) {
        console.error("Erreur dans AdminController.getTopBooks:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des livres les plus vendus." });
    }
};

/**
 * Récupère les commandes récentes pour le tableau de bord.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const getRecentOrders = async (req, res) => {
    try {
        const recentOrders = await AdminModel.getRecentOrders(); // Utilise la limite par défaut (5)
        res.status(200).json(recentOrders);
    } catch (error) {
        console.error("Erreur dans AdminController.getRecentOrders:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des commandes récentes." });
    }
};

/**
 * Récupère tous les livres avec pagination pour l'administration.
 * @param {object} req - L'objet requête Express. Peut contenir req.query.page et req.query.limit.
 * @param {object} res - L'objet réponse Express.
 */
export const getAllBooksAdmin = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    try {
        const { books, total, page: currentPage, limit: currentLimit } = await AdminModel.getAllBooksAdmin(page, limit);
        res.status(200).json({
            books,
            total,
            page: currentPage,
            limit: currentLimit,
            totalPages: Math.ceil(total / currentLimit),
        });
    } catch (error) {
        console.error("Erreur dans AdminController.getAllBooksAdmin:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des livres." });
    }
};

/**
 * Ajoute un nouveau livre.
 * @param {object} req - L'objet requête Express. Contient les données du livre dans req.body.
 * @param {object} res - L'objet réponse Express.
 */
export const addBookAdmin = async (req, res) => {
    const bookData = req.body;
    try {
        // Validation basique des données obligatoires (peut être étendue)
        if (!bookData.title || !bookData.author_name || !bookData.category_id || bookData.price === undefined || !bookData.book_file_url) {
            return res.status(400).json({ message: "Veuillez fournir tous les champs obligatoires : titre, nom de l'auteur, ID de catégorie, prix, et URL du fichier du livre." });
        }
        const newBook = await AdminModel.addBook(bookData);
        res.status(201).json({ message: "Livre ajouté avec succès.", book: newBook });
    } catch (error) {
        console.error("Erreur dans AdminController.addBookAdmin:", error.message);
        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({ message: "L'ID de catégorie fourni n'existe pas." });
        }
        res.status(500).json({ message: "Erreur interne du serveur lors de l'ajout du livre." });
    }
};

/**
 * Récupère les détails d'un livre spécifique.
 * @param {object} req - L'objet requête Express. Contient bookId dans req.params.
 * @param {object} res - L'objet réponse Express.
 */
export const getBookDetailsAdmin = async (req, res) => {
    const { bookId } = req.params;
    try {
        const book = await AdminModel.getBookByIdAdmin(bookId);
        if (!book) {
            return res.status(404).json({ message: "Livre non trouvé." });
        }
        res.status(200).json(book);
    } catch (error) {
        console.error("Erreur dans AdminController.getBookDetailsAdmin:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des détails du livre." });
    }
};

/**
 * Met à jour un livre existant.
 * @param {object} req - L'objet requête Express. Contient bookId dans req.params et les données de mise à jour dans req.body.
 * @param {object} res - L'objet réponse Express.
 */
export const updateBookAdmin = async (req, res) => {
    const { bookId } = req.params;
    const bookData = req.body;
    try {
        if (Object.keys(bookData).length === 0) {
            return res.status(400).json({ message: "Aucune donnée fournie pour la mise à jour." });
        }
        const updatedBook = await AdminModel.updateBookAdmin(bookId, bookData);
        if (!updatedBook) {
            return res.status(404).json({ message: "Livre non trouvé ou aucune donnée valide fournie pour la mise à jour." });
        }
        res.status(200).json({ message: "Livre mis à jour avec succès.", book: updatedBook });
    } catch (error) {
        console.error("Erreur dans AdminController.updateBookAdmin:", error.message);
        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({ message: "L'ID de catégorie fourni n'existe pas." });
        }
        if (error.code === '22P02') { // Invalid UUID format
            return res.status(400).json({ message: "Format d'ID de livre invalide." });
        }
        res.status(500).json({ message: "Erreur interne du serveur lors de la mise à jour du livre." });
    }
};

/**
 * Supprime un livre.
 * @param {object} req - L'objet requête Express. Contient bookId dans req.params.
 * @param {object} res - L'objet réponse Express.
 */
export const deleteBookAdmin = async (req, res) => {
    const { bookId } = req.params;
    try {
        const rowCount = await AdminModel.deleteBookAdmin(bookId);
        if (rowCount === 0) {
            return res.status(404).json({ message: "Livre non trouvé ou déjà supprimé." });
        }
        res.status(200).json({ message: "Livre supprimé avec succès." });
    } catch (error) {
        console.error("Erreur dans AdminController.deleteBookAdmin:", error.message);
        if (error.code === '22P02') { // Invalid UUID format
            return res.status(400).json({ message: "Format d'ID de livre invalide." });
        }
        res.status(500).json({ message: "Erreur interne du serveur lors de la suppression du livre." });
    }
};

/**
 * Recherche des livres par titre ou auteur.
 * @param {object} req - L'objet requête Express. Contient req.query.q (terme de recherche).
 * @param {object} res - L'objet réponse Express.
 */
export const searchBooksAdmin = async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ message: "Le terme de recherche est requis." });
    }
    try {
        const books = await AdminModel.searchBooksAdmin(q);
        res.status(200).json(books);
    } catch (error) {
        console.error("Erreur dans AdminController.searchBooksAdmin:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la recherche des livres." });
    }
};

/**
 * Récupère les statistiques de vente pour un ebook spécifique.
 * @param {object} req - L'objet requête Express. Contient bookId dans req.params.
 * @param {object} res - L'objet réponse Express.
 */
export const getBookSalesStats = async (req, res) => {
    const { bookId } = req.params;
    try {
        const stats = await AdminModel.getBookSalesStats(bookId);
        if (!stats) {
            return res.status(404).json({ message: "Livre non trouvé ou aucune statistique de vente disponible." });
        }
        res.status(200).json(stats);
    } catch (error) {
        console.error("Erreur dans AdminController.getBookSalesStats:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des statistiques de vente du livre." });
    }
};

/**
 * Récupère toutes les commandes avec pagination pour l'administration.
 * @param {object} req - L'objet requête Express. Peut contenir req.query.page et req.query.limit.
 * @param {object} res - L'objet réponse Express.
 */
export const getAllOrdersAdmin = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    try {
        const { orders, total, page: currentPage, limit: currentLimit } = await AdminModel.getAllOrdersAdmin(page, limit);
        res.status(200).json({
            orders,
            total,
            page: currentPage,
            limit: currentLimit,
            totalPages: Math.ceil(total / currentLimit),
        });
    } catch (error) {
        console.error("Erreur dans AdminController.getAllOrdersAdmin:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des commandes." });
    }
};

/**
 * Récupère les détails d'une commande spécifique pour l'administration.
 * @param {object} req - L'objet requête Express. Contient orderId dans req.params.
 * @param {object} res - L'objet réponse Express.
 */
export const getOrderDetailsAdmin = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await AdminModel.getOrderDetailsAdmin(orderId);
        if (!order) {
            return res.status(404).json({ message: "Commande non trouvée." });
        }
        res.status(200).json(order);
    } catch (error) {
        console.error("Erreur dans AdminController.getOrderDetailsAdmin:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des détails de la commande." });
    }
};

/**
 * Met à jour le statut d'une commande.
 * @param {object} req - L'objet requête Express. Contient orderId dans req.params et newStatus dans req.body.
 * @param {object} res - L'objet réponse Express.
 */
export const updateOrderStatusAdmin = async (req, res) => {
    const { orderId } = req.params;
    const { newStatus } = req.body;
    try {
        if (!newStatus) {
            return res.status(400).json({ message: "Le nouveau statut est requis." });
        }
        const updatedOrder = await AdminModel.updateOrderStatusAdmin(orderId, newStatus);
        if (!updatedOrder) {
            return res.status(404).json({ message: "Commande non trouvée ou statut inchangé." });
        }
        res.status(200).json({ message: "Statut de la commande mis à jour avec succès.", order: updatedOrder });
    } catch (error) {
        console.error("Erreur dans AdminController.updateOrderStatusAdmin:", error.message);
        if (error.code === '22P02') { // Invalid UUID format
            return res.status(400).json({ message: "Format d'ID de commande invalide." });
        }
        res.status(500).json({ message: "Erreur interne du serveur lors de la mise à jour du statut de la commande." });
    }
};

/**
 * Exporte toutes les commandes.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const exportOrders = async (req, res) => {
    try {
        const orders = await AdminModel.getAllOrdersForExport();
        // Pour un export CSV/Excel réel, vous utiliseriez une bibliothèque comme 'csv-stringify' ou 'exceljs'
        // Ici, nous allons simplement renvoyer les données JSON.
        res.status(200).json(orders);
    } catch (error) {
        console.error("Erreur dans AdminController.exportOrders:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de l'exportation des commandes." });
    }
};

/**
 * Récupère les statistiques globales des commandes.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const getOrderStats = async (req, res) => {
    try {
        const stats = await AdminModel.getOrderStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error("Erreur dans AdminController.getOrderStats:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des statistiques de commande." });
    }
};

/**
 * Récupère tous les clients avec pagination pour l'administration.
 * @param {object} req - L'objet requête Express. Peut contenir req.query.page et req.query.limit.
 * @param {object} res - L'objet réponse Express.
 */
export const getAllClientsAdmin = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    try {
        const { clients, total, page: currentPage, limit: currentLimit } = await AdminModel.getAllClientsAdmin(page, limit);
        res.status(200).json({
            clients,
            total,
            page: currentPage,
            limit: currentLimit,
            totalPages: Math.ceil(total / currentLimit),
        });
    } catch (error) {
        console.error("Erreur dans AdminController.getAllClientsAdmin:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des clients." });
    }
};

/**
 * Récupère les détails d'un client spécifique pour l'administration.
 * @param {object} req - L'objet requête Express. Contient userId dans req.params.
 * @param {object} res - L'objet réponse Express.
 */
export const getClientDetailsAdmin = async (req, res) => {
    const { userId } = req.params;
    try {
        const client = await AdminModel.getClientDetailsAdmin(userId);
        if (!client) {
            return res.status(404).json({ message: "Client non trouvé." });
        }
        res.status(200).json(client);
    } catch (error) {
        console.error("Erreur dans AdminController.getClientDetailsAdmin:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des détails du client." });
    }
};

/**
 * Met à jour les informations d'un client existant.
 * @param {object} req - L'objet requête Express. Contient userId dans req.params et les données de mise à jour dans req.body.
 * @param {object} res - L'objet réponse Express.
 */
export const updateClientAdmin = async (req, res) => {
    const { userId } = req.params;
    const clientData = req.body;
    try {
        if (Object.keys(clientData).length === 0) {
            return res.status(400).json({ message: "Aucune donnée fournie pour la mise à jour." });
        }
        const updatedClient = await AdminModel.updateClientAdmin(userId, clientData);
        if (!updatedClient) {
            return res.status(404).json({ message: "Client non trouvé ou aucune donnée valide fournie pour la mise à jour." });
        }
        res.status(200).json({ message: "Client mis à jour avec succès.", client: updatedClient });
    } catch (error) {
        console.error("Erreur dans AdminController.updateClientAdmin:", error.message);
        if (error.code === '22P02') { // Invalid UUID format
            return res.status(400).json({ message: "Format d'ID client invalide." });
        }
        res.status(500).json({ message: "Erreur interne du serveur lors de la mise à jour du client." });
    }
};

/**
 * Désactive le compte d'un client.
 * @param {object} req - L'objet requête Express. Contient userId dans req.params.
 * @param {object} res - L'objet réponse Express.
 */
export const deactivateClientAccount = async (req, res) => {
    const { userId } = req.params;
    try {
        const deactivatedClient = await AdminModel.deactivateClientAccount(userId);
        if (!deactivatedClient) {
            return res.status(404).json({ message: "Client non trouvé ou déjà désactivé." });
        }
        res.status(200).json({ message: "Compte client désactivé avec succès.", client: deactivatedClient });
    } catch (error) {
        console.error("Erreur dans AdminController.deactivateClientAccount:", error.message);
        if (error.code === '22P02') { // Invalid UUID format
            return res.status(400).json({ message: "Format d'ID client invalide." });
        }
        res.status(500).json({ message: "Erreur interne du serveur lors de la désactivation du compte client." });
    }
};

/**
 * Recherche des clients par nom ou email.
 * @param {object} req - L'objet requête Express. Contient req.query.q (terme de recherche).
 * @param {object} res - L'objet réponse Express.
 */
export const searchClientsAdmin = async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ message: "Le terme de recherche est requis." });
    }
    try {
        const clients = await AdminModel.searchClientsAdmin(q);
        res.status(200).json(clients);
    } catch (error) {
        console.error("Erreur dans AdminController.searchClientsAdmin:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la recherche des clients." });
    }
};

/**
 * Récupère toutes les commandes d'un client spécifique.
 * @param {object} req - L'objet requête Express. Contient userId dans req.params.
 * @param {object} res - L'objet réponse Express.
 */
export const getClientOrders = async (req, res) => {
    const { userId } = req.params;
    try {
        const orders = await AdminModel.getClientOrders(userId);
        if (!orders || orders.length === 0) {
            return res.status(404).json({ message: "Aucune commande trouvée pour ce client." });
        }
        res.status(200).json(orders);
    } catch (error) {
        console.error("Erreur dans AdminController.getClientOrders:", error.message);
        if (error.code === '22P02') { // Invalid UUID format
            return res.status(400).json({ message: "Format d'ID client invalide." });
        }
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération des commandes du client." });
    }
};

/**
 * Envoie un email à un client.
 * @param {object} req - L'objet requête Express. Contient userId dans req.params et subject, body dans req.body.
 * @param {object} res - L'objet réponse Express.
 */
export const sendEmailToClient = async (req, res) => {
    const { userId } = req.params;
    const { subject, body } = req.body;

    try {
        if (!subject || !body) {
            return res.status(400).json({ message: "Le sujet et le corps de l'email sont requis." });
        }

        // Récupérer l'email du client
        const client = await AdminModel.getClientDetailsAdmin(userId);
        if (!client) {
            return res.status(404).json({ message: "Client non trouvé." });
        }

        // Simuler l'envoi d'email
        const emailSent = await AdminModel.sendEmailToClient(client.email, subject, body);

        if (emailSent) {
            res.status(200).json({ message: "Email envoyé avec succès (simulation)." });
        } else {
            res.status(500).json({ message: "Échec de l'envoi de l'email." });
        }
    } catch (error) {
        console.error("Erreur dans AdminController.sendEmailToClient:", error.message);
        if (error.code === '22P02') { // Invalid UUID format
            return res.status(400).json({ message: "Format d'ID client invalide." });
        }
        res.status(500).json({ message: "Erreur interne du serveur lors de l'envoi de l'email." });
    }
};

/**
 * Génère un rapport des ventes.
 * @param {object} req - L'objet requête Express. Peut contenir req.query.startDate et req.query.endDate.
 * @param {object} res - L'objet réponse Express.
 */
export const getSalesReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Les dates de début et de fin (startDate, endDate) sont requises." });
        }
        const report = await AdminModel.getSalesReport(startDate, endDate);
        res.status(200).json(report);
    } catch (error) {
        console.error("Erreur dans AdminController.getSalesReport:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la génération du rapport des ventes." });
    }
};

/**
 * Génère un rapport des ventes par catégorie.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const getSalesByCategoryReport = async (req, res) => {
    try {
        const report = await AdminModel.getSalesByCategoryReport();
        res.status(200).json(report);
    } catch (error) {
        console.error("Erreur dans AdminController.getSalesByCategoryReport:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la génération du rapport des ventes par catégorie." });
    }
};

/**
 * Génère un rapport sur les méthodes de paiement.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const getPaymentMethodsReport = async (req, res) => {
    try {
        const report = await AdminModel.getPaymentMethodsReport();
        res.status(200).json(report);
    } catch (error) {
        console.error("Erreur dans AdminController.getPaymentMethodsReport:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la génération du rapport des méthodes de paiement." });
    }
};

/**
 * Calcule et renvoie le taux de conversion.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const getConversionRateReport = async (req, res) => {
    try {
        const report = await AdminModel.getConversionRateReport();
        res.status(200).json(report);
    } catch (error) {
        console.error("Erreur dans AdminController.getConversionRateReport:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors du calcul du taux de conversion." });
    }
};

/**
 * Exporte un rapport spécifique.
 * @param {object} req - L'objet requête Express. Contient reportType dans req.body et des filtres optionnels.
 * @param {object} res - L'objet réponse Express.
 */
export const exportReport = async (req, res) => {
    const { reportType, filters } = req.body;
    try {
        if (!reportType) {
            return res.status(400).json({ message: "Le type de rapport à exporter (reportType) est requis." });
        }

        const data = await AdminModel.getExportData(reportType, filters);

        // Dans une application réelle, vous généreriez ici un fichier CSV/Excel
        // et l'enverriez en réponse. Pour cet exemple, nous renvoyons les données JSON.
        res.status(200).json({
            message: `Données pour l'exportation du rapport ${reportType} récupérées avec succès.`, 
            data,
            reportType,
        });
    } catch (error) {
        console.error("Erreur dans AdminController.exportReport:", error.message);
        res.status(500).json({ message: `Erreur interne du serveur lors de l'exportation du rapport ${reportType}.` });
    }
};

/**
 * Simule l'upload d'une couverture de livre.
 * Dans une vraie application, cela utiliserait 'multer' ou un service de stockage cloud.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const uploadCover = async (req, res) => {
    // Ici, vous auriez la logique de traitement du fichier uploadé
    // Pour la simulation, nous allons juste renvoyer une URL fictive.
    const dummyUrl = `https://example.com/covers/${Date.now()}_cover.jpg`;
    await AdminModel.logActivity(req.user.userId, 'COVER_UPLOAD', `Couverture de livre uploadée (simulé): ${dummyUrl}`, { url: dummyUrl });
    res.status(200).json({ message: "Couverture de livre uploadée avec succès (simulé).", url: dummyUrl });
};

/**
 * Simule l'upload d'un fichier ebook.
 * Dans une vraie application, cela utiliserait 'multer' ou un service de stockage cloud.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const uploadEbook = async (req, res) => {
    // Ici, vous auriez la logique de traitement du fichier uploadé
    // Pour la simulation, nous allons juste renvoyer une URL fictive.
    const dummyUrl = `https://example.com/ebooks/${Date.now()}_ebook.pdf`;
    await AdminModel.logActivity(req.user.userId, 'EBOOK_UPLOAD', `Fichier ebook uploadé (simulé): ${dummyUrl}`, { url: dummyUrl });
    res.status(200).json({ message: "Fichier ebook uploadé avec succès (simulé).", url: dummyUrl });
};

/**
 * Génère les détails d'une facture pour une commande donnée.
 * @param {object} req - L'objet requête Express. Contient orderId dans req.params.
 * @param {object} res - L'objet réponse Express.
 */
export const generateInvoice = async (req, res) => {
    const { orderId } = req.params;
    try {
        const invoiceDetails = await AdminModel.getInvoiceDetails(orderId);
        if (!invoiceDetails) {
            return res.status(404).json({ message: "Commande non trouvée pour générer la facture." });
        }
        await AdminModel.logActivity(req.user.userId, 'INVOICE_GENERATED', `Facture générée pour la commande ${orderId}`, { orderId });
        res.status(200).json({ message: "Détails de la facture récupérés avec succès.", invoice: invoiceDetails });
    } catch (error) {
        console.error("Erreur dans AdminController.generateInvoice:", error.message);
        if (error.code === '22P02') { // Invalid UUID format
            return res.status(400).json({ message: "Format d'ID de commande invalide." });
        }
        res.status(500).json({ message: "Erreur interne du serveur lors de la génération de la facture." });
    }
};

/**
 * Récupère le journal d'activité.
 * @param {object} req - L'objet requête Express. Peut contenir req.query.page et req.query.limit.
 * @param {object} res - L'objet réponse Express.
 */
export const getActivityLogsController = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    try {
        const { logs, total, page: currentPage, limit: currentLimit } = await AdminModel.getActivityLogs(page, limit);
        res.status(200).json({
            logs,
            total,
            page: currentPage,
            limit: currentLimit,
            totalPages: Math.ceil(total / currentLimit),
        });
    } catch (error) {
        console.error("Erreur dans AdminController.getActivityLogsController:", error.message);
        res.status(500).json({ message: "Erreur interne du serveur lors de la récupération du journal d'activité." });
    }
};
