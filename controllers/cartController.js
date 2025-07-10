// controllers/cartController.js
import * as cartModel from "../models/cartModel.js";
import * as bookModel from "../models/bookModel.js";
// Pour vérifier l'existence du livre
/**
 * Affiche le contenu du panier de l'utilisateur authentifié.
 * @param {object} req - L'objet requête Express (req.user.userId sera présent).
 * @param {object} res - L'objet réponse Express.
 */
export const getCartContent = async (req, res) => {
    const userId = req.user.userId;

    try {
        const cart = await cartModel.getOrCreateCart(userId); // Assure-toi que l'utilisateur a un panier
        const cartItems = await cartModel.getCartItemsByCartId(cart.cart_id);
        const totalItemsInCart = cartItems.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

        res.status(200).json({
            message: "Contenu du panier récupéré avec succès.",
            cart: {
                cart_id: cart.cart_id,
                items: cartItems,
                total_items_count: totalItemsInCart,
            },
        });
    } catch (error) {
        console.error(
            "Erreur lors de la récupération du panier :",
            error.message
        );
        res.status(500).json({
            message:
                "Erreur interne du serveur lors de la récupération du panier.",
        });
    }
};

/**
 * Ajoute un livre au panier de l'utilisateur authentifié.
 * Si le livre existe déjà, sa quantité est mise à jour.
 * @param {object} req - L'objet requête Express (req.user.userId sera présent, bookId et quantity dans le corps).
 * @param {object} res - L'objet réponse Express.
 */
export const addItemToCart = async (req, res) => {
    const userId = req.user.userId;
    const { bookId, quantity = 1 } = req.body; // Par défaut, la quantité est 1

    try {
        if (!bookId) {
            return res
                .status(400)
                .json({ message: "L'ID du livre est requis." });
        }
        if (typeof quantity !== "number" || quantity <= 0) {
            return res
                .status(400)
                .json({ message: "La quantité doit être un nombre positif." });
        }

        // 1. Vérifier si le livre existe réellement
        const bookExists = await bookModel.findBookById(bookId);
        if (!bookExists) {
            return res.status(404).json({ message: "Livre non trouvé." });
        }

        // 2. Récupérer ou créer le panier de l'utilisateur
        const cart = await cartModel.getOrCreateCart(userId);

        // 3. Ajouter ou mettre à jour l'article dans le panier
        const cartItem = await cartModel.addOrUpdateCartItem(
            cart.cart_id,
            bookId,
            quantity
        );

        res.status(200).json({
            message: "Livre ajouté/mis à jour dans le panier avec succès.",
            cartItem: cartItem,
        });
    } catch (error) {
        console.error(
            "Erreur lors de l'ajout d'un article au panier :",
            error.message
        );
        // Gérer les erreurs spécifiques si nécessaire, par exemple FK violation
        if (error.code === "22P02" || error.code === "23503") {
            // ID invalide ou FK non trouvée
            return res
                .status(400)
                .json({ message: "ID de livre ou de panier invalide." });
        }
        res.status(500).json({
            message: "Erreur interne du serveur lors de l'ajout au panier.",
        });
    }
};

/**
 * Modifie la quantité d'un livre spécifique dans le panier de l'utilisateur.
 * @param {object} req - L'objet requête Express (req.user.userId, book_id dans params, quantity dans body).
 * @param {object} res - L'objet réponse Express.
 */
export const updateCartItem = async (req, res) => {
    const userId = req.user.userId;
    const { book_id } = req.params; // book_id de l'URL
    const { quantity } = req.body; // nouvelle quantité du corps

    try {
        if (!book_id) {
            return res
                .status(400)
                .json({ message: "L'ID du livre est requis dans l'URL." });
        }
        if (typeof quantity !== "number" || quantity < 0) {
            // La quantité peut être 0 pour retirer l'article
            return res
                .status(400)
                .json({
                    message: "La quantité doit être un nombre positif ou zéro.",
                });
        }

        const cart = await cartModel.getOrCreateCart(userId);
        const updatedItem = await cartModel.updateCartItemQuantity(
            cart.cart_id,
            book_id,
            quantity
        );

        if (!updatedItem) {
            return res
                .status(404)
                .json({
                    message:
                        "Livre non trouvé dans le panier ou quantité à zéro.",
                });
        }

        res.status(200).json({
            message: "Quantité du livre mise à jour dans le panier.",
            cartItem: updatedItem,
        });
    } catch (error) {
        console.error(
            "Erreur lors de la mise à jour de la quantité du panier :",
            error.message
        );
        res.status(500).json({
            message:
                "Erreur interne du serveur lors de la mise à jour du panier.",
        });
    }
};

/**
 * Retire un livre spécifique du panier de l'utilisateur.
 * @param {object} req - L'objet requête Express (req.user.userId, book_id dans params).
 * @param {object} res - L'objet réponse Express.
 */
export const deleteCartItem = async (req, res) => {
    const userId = req.user.userId;
    const { book_id } = req.params; // book_id de l'URL

    try {
        if (!book_id) {
            return res
                .status(400)
                .json({ message: "L'ID du livre est requis dans l'URL." });
        }

        const cart = await cartModel.getOrCreateCart(userId);
        const removed = await cartModel.removeCartItem(cart.cart_id, book_id);

        if (!removed) {
            return res
                .status(404)
                .json({ message: "Livre non trouvé dans le panier." });
        }

        res.status(200).json({
            message: "Livre retiré du panier avec succès.",
        });
    } catch (error) {
        console.error(
            "Erreur lors du retrait d'un livre du panier :",
            error.message
        );
        res.status(500).json({
            message: "Erreur interne du serveur lors du retrait du panier.",
        });
    }
};
