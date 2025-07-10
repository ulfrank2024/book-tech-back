// controllers/checkoutController.js
import * as checkoutModel from "../models/checkoutModel.js";
import * as cartModel from "../models/cartModel.js";
import * as bookModel from "../models/bookModel.js"; // Pour le prix des livres, etc.

// Stockage temporaire pour les sessions de checkout non finalisées.
// Dans une vraie application, ceci serait stocké de manière persistante (base de données, Redis, etc.)
// ou la logique serait gérée différemment (ex: passer directement du panier à l'ordre 'Pending').
// Pour cet exemple, nous allons utiliser l'ID du panier comme identifiant de session de checkout temporaire.
// Ou mieux, nous allons créer une Order avec le statut 'Pending' très tôt.

// Une approche plus robuste pour la session serait de créer un ORDER avec le statut 'Pending'
// dès la première étape de checkout et de le mettre à jour.

/**
 * Gère l'enregistrement ou la sélection d'une adresse de livraison.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const setShippingInformation = async (req, res) => {
    const userId = req.user.userId;
    const {
        addressId, // Si l'utilisateur sélectionne une adresse existante
        address_line1,
        address_line2,
        city,
        province,
        postal_code,
        country,
        is_default,
    } = req.body;

    try {
        let selectedAddressId = addressId;
        let message = "Informations de livraison mises à jour avec succès.";

        if (addressId) {
            // Optionnel: Vérifier que l'adresse appartient bien à l'utilisateur
            const addresses = await checkoutModel.getShippingAddresses(userId);
            const foundAddress = addresses.find(
                (addr) => addr.address_id === addressId
            );
            if (!foundAddress) {
                return res
                    .status(404)
                    .json({
                        message:
                            "Adresse de livraison non trouvée pour cet utilisateur.",
                    });
            }
            // Si l'adresse est trouvée, on utilise son ID
            selectedAddressId = foundAddress.address_id;
            message = "Adresse de livraison sélectionnée avec succès.";
        } else if (
            address_line1 &&
            city &&
            province &&
            postal_code &&
            country
        ) {
            // Enregistrer une nouvelle adresse
            const newAddress = await checkoutModel.saveShippingAddress(userId, {
                address_line1,
                address_line2,
                city,
                province,
                postal_code,
                country,
                is_default,
            });
            selectedAddressId = newAddress.address_id;
            message =
                "Nouvelle adresse de livraison enregistrée et sélectionnée avec succès.";
        } else {
            return res
                .status(400)
                .json({
                    message:
                        "Veuillez fournir un addressId existant ou les détails complets d'une nouvelle adresse.",
                });
        }

        // Pour la "session", nous allons créer une commande en attente (Pending)
        // si elle n'existe pas encore pour cet utilisateur et y associer l'adresse.
        // Récupérer le panier pour calculer le total
        const cart = await cartModel.getOrCreateCart(userId);
        const cartItems = await cartModel.getCartItemsByCartId(cart.cart_id);

        if (cartItems.length === 0) {
            return res
                .status(400)
                .json({
                    message:
                        "Votre panier est vide. Impossible de démarrer le checkout.",
                });
        }

        let order;
        // On essaie de voir si une commande 'Pending' existe déjà pour cet utilisateur
        // (Simplification: dans un vrai scénario, on pourrait stocker l'ID de la session de checkout)
        // Pour cet exemple, on peut récupérer la dernière commande en attente.
        // Ou plus simple: Créer l'ordre ici et passer son ID aux étapes suivantes.
        // On va créer un nouvel ordre à chaque fois pour cet exemple, et le confirmer à la fin.
        // Une session de checkout est mieux gérée avec un ID de session côté client
        // ou en utilisant un champ `checkout_session_id` dans la table `Orders` avec un statut 'Draft'.

        // Solution simplifiée pour la session de checkout :
        // Créer une commande avec un statut "Draft" ou "Pending"
        // et stocker son ID dans le cache du serveur ou passer l'ID en réponse.
        // Pour une application robuste, utilisez une table `CheckoutSessions` ou un système de cache (Redis).
        // Ici, nous allons simplement répondre avec l'ID d'adresse sélectionnée.

        // Dans un processus de checkout multi-étapes, tu auras besoin de passer l'ID de la commande/session
        // entre les requêtes POST/PUT pour lier les informations.
        // Par exemple, l'ID de la commande "Pending" serait renvoyé ici et utilisé pour la requête de paiement.

        res.status(200).json({
            message: message,
            shippingAddressId: selectedAddressId,
            // Prochaine étape : retourner un ID de session de checkout ou un ID de commande 'Draft'
            // Pour l'instant, l'ID de l'adresse est suffisant pour indiquer que cette étape est passée.
        });
    } catch (error) {
        console.error(
            "Erreur lors de l'enregistrement des infos de livraison :",
            error.message
        );
        res.status(500).json({
            message:
                "Erreur interne du serveur lors de l'enregistrement des informations de livraison.",
        });
    }
};

/**
 * Gère le choix et le traitement de la méthode de paiement.
 * Dans un vrai scénario, cela impliquerait l'intégration avec un prestataire de paiement (Stripe, PayPal).
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const setPaymentMethod = async (req, res) => {
    const userId = req.user.userId;
    const { paymentMethod, shippingAddressId, transactionDetails } = req.body; // shippingAddressId est crucial pour lier à l'ordre

    try {
        if (!paymentMethod) {
            return res
                .status(400)
                .json({ message: "La méthode de paiement est requise." });
        }
        // Vérifiez si shippingAddressId est fourni si la livraison physique est activée
        // Ou si c'est pour des ebooks, shippingAddressId peut être null ou non requis.

        // Récupérer le panier pour calculer le total
        const cart = await cartModel.getOrCreateCart(userId);
        const cartItems = await cartModel.getCartItemsByCartId(cart.cart_id);

        if (cartItems.length === 0) {
            return res
                .status(400)
                .json({
                    message:
                        "Votre panier est vide. Impossible de procéder au paiement.",
                });
        }

        const totalAmount = cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // --- SIMULATION DE PAIEMENT ---
        // Dans un vrai scénario : appel à l'API d'un fournisseur de paiement (Stripe, PayPal)
        let paymentStatus = "Failed";
        let transactionId = null;

        // Simule une réussite si la méthode est 'Credit Card' ou 'PayPal'
        if (["Credit Card", "PayPal", "E-Wallet"].includes(paymentMethod)) {
            paymentStatus = "Completed"; // Simule le succès
            transactionId = `txn_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 10)}`; // ID de transaction fictif
        } else {
            return res
                .status(400)
                .json({ message: "Méthode de paiement non supportée." });
        }
        // --- FIN SIMULATION ---

        // Créer une commande en attente (status 'Pending' ou 'Draft')
        // Si l'ID de la commande était passée depuis l'étape précédente, on l'utiliserait.
        // Ici, on va en créer une pour cet exemple, et on la finalisera à la confirmation.
        // Ou, si tu as déjà une orderId dans la "session" (e.g. dans un cache), tu l'utilises.
        // Pour simplifier ici, on va créer l'ordre et le statut "Pending"
        const order = await checkoutModel.createOrder(
            userId,
            totalAmount,
            shippingAddressId
        );

        // Enregistrer le paiement
        const payment = await checkoutModel.createPaymentRecord(
            userId,
            order.order_id,
            paymentMethod,
            totalAmount,
            paymentStatus,
            transactionId
        );

        if (paymentStatus === "Completed") {
            // Mettre à jour le statut de la commande avec l'ID du paiement
            await checkoutModel.updateOrderStatus(
                order.order_id,
                "Payment_Success",
                payment.payment_id
            );
            res.status(200).json({
                message:
                    "Méthode de paiement enregistrée et paiement simulé réussi.",
                paymentId: payment.payment_id,
                orderId: order.order_id, // Retourne l'ID de la commande pour la prochaine étape
                status: "Payment_Success",
            });
        } else {
            await checkoutModel.updateOrderStatus(
                order.order_id,
                "Payment_Failed",
                payment.payment_id
            );
            res.status(402).json({
                // 402 Payment Required
                message: "Paiement échoué. Veuillez réessayer.",
                paymentId: payment.payment_id,
                orderId: order.order_id,
                status: "Payment_Failed",
            });
        }
    } catch (error) {
        console.error(
            "Erreur lors de la configuration de la méthode de paiement :",
            error.message
        );
        res.status(500).json({
            message:
                "Erreur interne du serveur lors du traitement du paiement.",
        });
    }
};

/**
 * Confirme et finalise la commande.
 * Cela implique de transférer les articles du panier vers la commande et de vider le panier.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const confirmOrder = async (req, res) => {
    const userId = req.user.userId;
    const { orderId } = req.body; // L'ID de la commande 'Pending' de l'étape précédente

    try {
        if (!orderId) {
            return res
                .status(400)
                .json({
                    message:
                        "L'ID de la commande est requis pour la confirmation.",
                });
        }

        const order = await checkoutModel.getOrderById(orderId);

        if (!order || order.user_id !== userId) {
            return res
                .status(404)
                .json({
                    message:
                        "Commande non trouvée ou n'appartient pas à cet utilisateur.",
                });
        }
        if (order.status !== "Payment_Success") {
            return res
                .status(400)
                .json({
                    message:
                        "La commande n'est pas prête à être confirmée (statut: " +
                        order.status +
                        ").",
                });
        }

        // Récupérer les articles du panier de l'utilisateur
        const cart = await cartModel.getOrCreateCart(userId);
        const cartItems = await cartModel.getCartItemsByCartId(cart.cart_id);

        if (cartItems.length === 0) {
            return res
                .status(400)
                .json({
                    message:
                        "Votre panier est vide. Impossible de confirmer une commande sans articles.",
                });
        }

        // Préparer les articles pour OrderItems
        const itemsForOrder = await Promise.all(
            cartItems.map(async (item) => {
                const book = await bookModel.findBookById(item.book_id);
                if (!book) {
                    throw new Error(
                        `Livre avec ID ${item.book_id} non trouvé.`
                    ); // Gérer le cas où un livre aurait été supprimé
                }
                return {
                    book_id: item.book_id,
                    quantity: item.quantity,
                    price_at_purchase: book.price, // Utilise le prix actuel du livre
                };
            })
        );

        // Ajouter les articles au OrderItems
        await checkoutModel.addOrderItems(order.order_id, itemsForOrder);

        // Mettre à jour le statut de la commande à 'Completed'
        await checkoutModel.updateOrderStatus(order.order_id, "Completed");

        // Vider le panier de l'utilisateur après confirmation réussie
        for (const item of cartItems) {
            await cartModel.removeCartItem(cart.cart_id, item.book_id);
        }

        // Optionnel : Ajouter les livres achetés à la table UserBooks
        for (const item of itemsForOrder) {
            await bookModel.purchaseBook(userId, item.book_id); // Réutilise ta fonction purchaseBook existante
        }

        res.status(200).json({
            message: "Commande finalisée avec succès !",
            orderId: order.order_id,
            status: "Completed",
        });
    } catch (error) {
        console.error(
            "Erreur lors de la confirmation de la commande :",
            error.message
        );
        res.status(500).json({
            message:
                "Erreur interne du serveur lors de la confirmation de la commande.",
        });
    }
};

/**
 * Affiche l'état actuel de la session de checkout pour l'utilisateur.
 * Pour cet exemple, cela affichera le panier et les adresses de livraison enregistrées.
 * Dans un système plus complexe, cela lirait l'état d'une table CheckoutSession.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const getCheckoutSessionStatus = async (req, res) => {
    const userId = req.user.userId;

    try {
        const cart = await cartModel.getOrCreateCart(userId);
        const cartItems = await cartModel.getCartItemsByCartId(cart.cart_id);
        const totalAmount = cartItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
        const shippingAddresses = await checkoutModel.getShippingAddresses(
            userId
        ); // Si pertinent

        // Optionnel: Récupérer la dernière commande 'Pending' de l'utilisateur si une session est déjà démarrée
        // Cette partie dépendra de comment tu stockes l'état de la session de checkout
        // Pour l'instant, on se contente de donner un aperçu.

        res.status(200).json({
            message: "État actuel de la session de checkout.",
            userId: userId,
            cart: {
                cart_id: cart.cart_id,
                items: cartItems,
                total_amount: totalAmount,
            },
            shippingAddresses: shippingAddresses, // S'il y a une table ShippingAddresses
            // Ici tu pourrais ajouter l'état du paiement si tu avais une session de paiement en cours
            // currentOrderId: "...", // Si tu as une commande 'Pending' associée
        });
    } catch (error) {
        console.error(
            "Erreur lors de la récupération de l'état du checkout :",
            error.message
        );
        res.status(500).json({
            message:
                "Erreur interne du serveur lors de la récupération de l'état du checkout.",
        });
    }
};
