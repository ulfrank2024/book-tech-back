// routes/AdminRoute.js
import express from "express";
import {
    getAllUsers,
    updateUserRole,
    getAllRoles,
    getDashboardStats,
    getSalesChartData,
    getTopBooks,
    getRecentOrders,
    getAllBooksAdmin,
    addBookAdmin,
    getBookDetailsAdmin,
    updateBookAdmin,
    deleteBookAdmin,
    searchBooksAdmin,
    getBookSalesStats,
    getAllOrdersAdmin,
    getOrderDetailsAdmin,
    updateOrderStatusAdmin,
    exportOrders,
    getOrderStats,
    getAllClientsAdmin,
    getClientDetailsAdmin,
    updateClientAdmin,
    deactivateClientAccount,
    searchClientsAdmin,
    getClientOrders,
    sendEmailToClient,
    getSalesReport,
    getSalesByCategoryReport,
    getPaymentMethodsReport,
    getConversionRateReport,
    exportReport,
    uploadCover,
    uploadEbook,
    generateInvoice,
    getActivityLogsController,
} from "../controllers/AdminController.js";
import { authenticateToken, authorizeAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Toutes les routes admin nécessitent une authentification et une autorisation d'administrateur
router.use(authenticateToken, authorizeAdmin);

// Routes de gestion des utilisateurs et rôles
router.get("/users", getAllUsers);
router.put("/users/:userId/role", updateUserRole);
router.get("/roles", getAllRoles);

// Routes pour le tableau de bord
router.get("/dashboard/stats", getDashboardStats);
router.get("/dashboard/sales-chart", getSalesChartData);
router.get("/dashboard/top-books", getTopBooks);
router.get("/dashboard/recent-orders", getRecentOrders);

// Routes de gestion des ebooks
router.get("/books", getAllBooksAdmin); // Lister tous les ebooks (avec pagination)
router.post("/books", addBookAdmin);     // Ajouter un nouvel ebook
router.get("/books/search", searchBooksAdmin); // Recherche d'ebooks
router.get("/books/stats/:bookId", getBookSalesStats); // Statistiques de vente d'un ebook
router.get("/books/:bookId", getBookDetailsAdmin); // Détails d'un ebook
router.put("/books/:bookId", updateBookAdmin);     // Mettre à jour un ebook
router.delete("/books/:bookId", deleteBookAdmin); // Supprimer un ebook

// Routes de gestion des commandes
router.get("/orders", getAllOrdersAdmin); // Lister toutes les commandes
router.get("/orders/export", exportOrders); // Exporter les commandes
router.get("/orders/stats", getOrderStats); // Statistiques des commandes
router.get("/orders/:orderId", getOrderDetailsAdmin); // Détails d'une commande
router.put("/orders/:orderId/status", updateOrderStatusAdmin); // Mettre à jour le statut d'une commande

// Routes de gestion des clients
router.get("/users", getAllClientsAdmin); // Lister tous les clients
router.get("/users/search", searchClientsAdmin); // Recherche de clients
router.get("/users/:userId", getClientDetailsAdmin); // Détails d'un client
router.put("/users/:userId", updateClientAdmin); // Modifier un client
router.put("/users/:userId/deactivate", deactivateClientAccount); // Désactiver un compte
router.get("/users/:userId/orders", getClientOrders); // Commandes d'un client
router.post("/users/:userId/email", sendEmailToClient); // Envoyer un email au client

// Routes de rapports et analyses
router.get("/reports/sales", getSalesReport); // Rapport des ventes (filtrable par période)
router.get("/reports/categories", getSalesByCategoryReport); // Ventes par catégorie
router.get("/reports/payments", getPaymentMethodsReport); // Méthodes de paiement
router.get("/reports/conversion", getConversionRateReport); // Taux de conversion
router.post("/reports/export", exportReport); // Exporter un rapport

// Routes d'upload de fichiers (simulées)
router.post("/upload/cover", uploadCover); // Upload une couverture de livre
router.post("/upload/ebook", uploadEbook); // Upload un fichier ebook

// Routes de gestion des factures et logs
router.get("/invoices/:orderId", generateInvoice); // Générer une facture
router.get("/activity-logs", getActivityLogsController); // Journal d'activité

export default router;
