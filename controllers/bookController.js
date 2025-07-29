// controllers/bookController.js
import * as bookModel from "../models/bookModel.js"; // Importe toutes les fonctions du modèle
/**
 * Gère la requête pour créer un nouveau livre.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const createBook = async (req, res) => {
    const bookData = req.body; // Récupère toutes les données du corps de la requête
    try {
        // Validation basique des données obligatoires
        // Cette validation pourrait aussi être faite dans un middleware ou un schéma Joi/Yup
        if (
            !bookData.title ||
            !bookData.author_name ||
            !bookData.category_id ||
            bookData.price === undefined ||
            bookData.price === null ||
            !bookData.book_file_url
        ) {
            return res
                .status(400)
                .json({
                    message:
                        "Veuillez fournir tous les champs obligatoires : titre, nom de l'auteur, ID de catégorie, prix, et URL du fichier du livre.",
                });
        }
        // Appelle la fonction du modèle pour insérer le livre
        const newBook = await bookModel.insertBook(bookData);
        // Renvoie le livre créé avec un statut 201 (Created)
        res.status(201).json(newBook);
    } catch (error) {
        console.error("Erreur dans le contrôleur createBook :", error.message);
        // Gestion des erreurs spécifiques de PostgreSQL (propagées par le modèle)
        if (error.code === "23503") {
            if (error.constraint === "books_category_id_fkey") {
                return res
                    .status(400)
                    .json({
                        message: "L'ID de catégorie fourni n'existe pas.",
                    });
            }
        }
        if (error.code === "23502") {
            return res
                .status(400)
                .json({
                    message:
                        "Un champ obligatoire est manquant. " + error.detail,
                });
        }
        res.status(500).json({
            message: "Erreur interne du serveur lors de la création du livre.",
        });
    }
};
/**
 * Gère la requête pour récupérer tous les livres.
 * @param {object} req - L'objet requête Express.
 * @param {object} res - L'objet réponse Express.
 */
export const getAllBooks = async (req, res) => {
    try {
        const books = await bookModel.findAllBooks();
        res.status(200).json(books);
    } catch (error) {
        console.error("Erreur dans le contrôleur getAllBooks :", error.message);
        res.status(500).json({
            message:
                "Erreur interne du serveur lors de la récupération des livres.",
        });
    }
};
/**
 * Récupère les livres d'une catégorie spécifique par son nom.
 * @param {string} categoryName - Le nom de la catégorie (ex: 'Fantasy').
 * @returns {Promise<Array>} Un tableau de livres appartenant à cette catégorie.
 */
export const findBooksByCategoryName = async (categoryName) => {
    try {
        // Jointure avec BookCategories pour filtrer par le nom de la catégorie
        const result = await pool.query(
            `SELECT b.*, bc.category_name 
             FROM Books b 
             JOIN BookCategories bc ON b.category_id = bc.category_id
             WHERE bc.category_name ILIKE $1 
             ORDER BY b.title ASC;`,
            [categoryName]
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans bookModel.findBooksByCategoryName:", error.message);
        throw error;
    }
};
//afficher les livres par categories
export const getBooksByCategory = async (req, res) => {
    const { categoryName } = req.params;
    try {
        if (!categoryName) {
            return res
                .status(400)
                .json({ message: "Le nom de la catégorie est requis." });
        }
        const books = await bookModel.findBooksByCategoryName(categoryName);
        if (books.length === 0) {
            return res
                .status(404)
                .json({
                    message: `Aucun livre trouvé pour la catégorie '${categoryName}'.`,
                });
        }
        res.status(200).json(books);
    } catch (error) {
        console.error(
            "Erreur dans le contrôleur getBooksByCategory :",
            error.message
        );
        res.status(500).json({
            message:
                "Erreur interne du serveur lors de la récupération des livres par catégorie.",
        });
    }
};
// controllers/bookController.js

// ... (other imports and functions) ...

export const getBookDetails = async (req, res) => {
    const { bookId } = req.params; // Correctly extracting bookId from URL parameters

    try {
        if (!bookId) {
            // This check might be redundant if your route is /books/:bookId,
            // as bookId would typically always be present.
            // However, it doesn't hurt to keep it for robustness.
            return res.status(400).json({ message: "L'ID du livre est requis." });
        }

        const book = await bookModel.findBookById(bookId); // Using bookId here
        const comments = await bookModel.getCommentsForBook(bookId); 

        if (!book) {
            return res.status(404).json({ message: "Livre non trouvé." });
        }

        // --- THE IMPORTANT FIX IS HERE ---
        const likesCount = await bookModel.countLikesForBook(bookId); // <-- USE bookId HERE
        // --- END OF IMPORTANT FIX ---

        // Also, you'll want to include the likesCount in the response
        // Currently, you're just sending `book`. Let's add the likesCount to it.
        res.status(200).json({
            message: "Détails du livre récupérés avec succès.",
            book: {
                ...book, // Spread all existing book properties
                likes_count: likesCount, // Add the likes_count property
                comments: comments
            }
        });

    } catch (error) {
        console.error(
            "Erreur dans le contrôleur getBookDetails :",
            error.message
        );
        res.status(500).json({
            message: "Erreur interne du serveur lors de la récupération des détails du livre.",
        });
    }
};
/**
 * Gère la requête pour mettre à jour un livre spécifique.
 * @param {object} req - L'objet requête Express. Contient req.params.bookId et req.body.
 * @param {object} res - L'objet réponse Express.
 */
export const updateBook = async (req, res) => {
    const { bookId } = req.params; 
    const bookData = req.body;     

    try {
        if (!bookId) {
            return res.status(400).json({ message: "L'ID du livre est requis pour la mise à jour." });
        }
        if (Object.keys(bookData).length === 0) {
            return res.status(400).json({ message: "Aucune donnée fournie pour la mise à jour." });
        }

        const updatedBook = await bookModel.updateBookById(bookId, bookData);

        if (!updatedBook) {
            return res.status(404).json({ message: "Livre non trouvé ou aucune donnée valide fournie pour la mise à jour." });
        }
        res.status(200).json(updatedBook); 
    } catch (error) {
        console.error("Erreur dans le contrôleur updateBook :", error.message);
        if (error.code === "23503") { 
            if (error.constraint === "books_category_id_fkey") {
                return res.status(400).json({ message: "L'ID de catégorie fourni n'existe pas." });
            }
        }
        if (error.code === "22P02") { 
             return res.status(400).json({ message: "Format d'ID de livre ou de données invalide." });
        }
        if (error.code === "23502") { 
            return res.status(400).json({ message: `Un champ obligatoire est manquant ou ne peut être null: ${error.detail}` });
        }
        res.status(500).json({
            message: "Erreur interne du serveur lors de la mise à jour du livre.",
        });
    }
};
/**
 * Gère la requête pour rechercher des livres par titre et/ou prix maximum.
 * Les termes de recherche sont passés via des paramètres de requête (ex: /api/books/search?title=dune&price=25).
 * @param {object} req - L'objet requête Express. Contient req.query.title et/ou req.query.price.
 * @param {object} res - L'objet réponse Express.
 */
export const searchBooks = async (req, res) => {
    const { title, price } = req.query; // Récupère les deux paramètres 'title' et 'price'

    try {
        // Vérifie qu'au moins un critère de recherche est fourni
        if ((!title || title.trim() === '') && (price === undefined || price === null || price.trim() === '')) {
            return res.status(400).json({ message: "Veuillez fournir un titre et/ou un prix maximum pour la recherche." });
        }

        const filters = {};
        if (title && title.trim() !== '') {
            filters.title = title.trim();
        }

        if (price !== undefined && price !== null && price.trim() !== '') {
            const parsedPrice = parseFloat(price);
            if (isNaN(parsedPrice) || parsedPrice < 0) {
                 return res.status(400).json({ message: "Le prix maximum doit être un nombre positif." });
            }
            filters.maxPrice = parsedPrice;
        }

        // Appelle la fonction du modèle avec l'objet filters
        const books = await bookModel.searchBooks(filters);

        if (books.length === 0) {
            let message = "Aucun livre trouvé correspondant à vos critères.";
            // Optionnel : affiner le message d'erreur pour l'utilisateur
            // if (title && price) message = `Aucun livre trouvé avec le titre contenant '${title}' et un prix inférieur ou égal à ${price}.`;
            // else if (title) message = `Aucun livre trouvé avec le titre contenant '${title}'.`;
            // else if (price) message = `Aucun livre trouvé avec un prix inférieur ou égal à ${price}.`;
            return res.status(404).json({ message });
        }

        res.status(200).json(books);
    } catch (error) {
        console.error("Erreur dans le contrôleur searchBooks :", error.message);
        res.status(500).json({
            message: "Erreur interne du serveur lors de la recherche des livres.",
        });
    }
};
/**
 * Supprime un livre de la base de données par son ID.
 * @param {string} bookId - L'ID UUID du livre à supprimer.
 * @returns {Promise<number>} Le nombre de lignes supprimées (0 si non trouvé, 1 si supprimé).
 */
export const deleteBook = async (req, res) => {
    const { bookId } = req.params; // L'ID du livre à supprimer (depuis l'URL)

    try {
        if (!bookId) {
            return res.status(400).json({ message: "L'ID du livre est requis pour la suppression." });
        }

        const rowCount = await bookModel.deleteBookById(bookId);

        if (rowCount === 0) {
            return res.status(404).json({ message: "Livre non trouvé ou déjà supprimé." });
        }

        // Standard pour une suppression réussie sans contenu à renvoyer
        res.status(204).send(); // 204 No Content
        // Ou si tu préfères un message de confirmation :
        // res.status(200).json({ message: "Livre supprimé avec succès." });

    } catch (error) {
        console.error("Erreur dans le contrôleur deleteBook :", error.message);

        // Gérer les erreurs spécifiques de PostgreSQL (par ex. si l'ID n'est pas un UUID valide)
        if (error.code === "22P02") { // invalid_text_representation (si bookId n'est pas un UUID valide)
             return res.status(400).json({ message: "Format d'ID de livre invalide." });
        }

        res.status(500).json({
            message: "Erreur interne du serveur lors de la suppression du livre.",
        });
    }
};
// Tu pourrais ajouter ici d'autres fonctions comme findBookById, updateBook, deleteBook, etc.
/**
 * Compte le nombre de likes pour un livre donné.
 * @param {string} bookId - L'ID UUID du livre.
 * @returns {Promise<number>} Le nombre de likes pour ce livre.
 */
export const countLikesForBook = async (bookId) => {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) FROM booklikes WHERE book_id = $1;`,
            [bookId]
        );
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        console.error("Erreur dans bookModel.countLikesForBook:", error.message);
        throw error;
    }
};
/**
 * Ajoute un commentaire pour un livre par un utilisateur.
 * @param {string} bookId - L'ID UUID du livre commenté.
 * @param {string} userId - L'ID UUID de l'utilisateur qui commente.
 * @param {string} commentText - Le texte du commentaire.
 * @returns {Promise<object>} L'entrée BookComment créée.
 */
export const addBookComment = async (bookId, userId, commentText) => {
    try {
        const result = await pool.query(
            `INSERT INTO bookcomments (book_id, user_id, comment_text)
             VALUES ($1, $2, $3)
             RETURNING comment_id, book_id, user_id, comment_text, publication_date;`,
            [bookId, userId, commentText]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans bookModel.addBookComment:", error.message);
        throw error;
    }
};
export const postBookComment = async (req, res) => {
    console.log("Executing postBookComment..."); // Added for debugging
    const userId = req.user.userId; // Vient du token JWT via le middleware authenticateToken
    const { bookId } = req.params;  // L'ID du livre doit venir des paramètres de l'URL
    const { commentText } = req.body; // Le texte du commentaire vient du corps JSON

    try {
        if (!bookId || !commentText || !userId) {
            return res
                .status(400)
                .json({
                    message:
                        "L'ID du livre, le texte du commentaire et l'ID utilisateur sont requis.",
                });
        }

        // Optionnel: Vérifier si le livre existe (recommandé)
        const bookExists = await bookModel.findBookById(bookId);
        if (!bookExists) {
            return res.status(404).json({ message: "Livre non trouvé." });
        }

        const newComment = await bookModel.addBookComment(
            bookId, // Ici on utilise le bookId des paramètres
            userId,
            commentText
        );

        res.status(201).json({
            message: "Commentaire ajouté avec succès !",
            comment: newComment,
        });
    } catch (error) {
        console.error("Erreur lors de l'ajout du commentaire :", error.message);
        if (error.code === "22P02" || error.code === "23503") {
            // ID invalide ou FK non trouvée
            return res
                .status(400)
                .json({ message: "ID de livre ou d'utilisateur invalide." });
        }
        res.status(500).json({
            message:
                "Erreur interne du serveur lors de l'ajout du commentaire.",
        });
    }
};

/**
 * Récupère tous les commentaires pour un livre donné, avec les infos de l'utilisateur.
 * @param {string} bookId - L'ID UUID du livre.
 * @returns {Promise<Array>} Un tableau d'objets commentaire.
 */
export const getCommentsForBook = async (bookId) => {
    try {
        const result = await pool.query(
            `SELECT
                bc.comment_id,
                bc.comment_text,
                bc.publication_date,
                u.user_id,
                u.first_name,
                u.last_name,
                u.email
             FROM bookcomments bc
             JOIN Users u ON bc.user_id = u.user_id
             WHERE bc.book_id = $1
             ORDER BY bc.publication_date DESC;`, // Ordre chronologique, du plus récent au plus ancien
            [bookId]
        );
        return result.rows;
    } catch (error) {
        console.error("Erreur dans bookModel.getCommentsForBook:", error.message);
        throw error;
    }
};

/**
 * Récupère toutes les catégories de livres de la base de données.
 * @returns {Promise<Array>} Un tableau de toutes les catégories.
 */
export const getAllCategories = async (req, res) => {
    try {
        const categories = await bookModel.findAllCategories();
        res.status(200).json(categories);
    } catch (error) {
        console.error("Erreur dans le contrôleur getAllCategories :", error.message);
        res.status(500).json({
            message: "Erreur interne du serveur lors de la récupération des catégories.",
        });
    }
};

/**
 * Gère la requête pour créer une nouvelle catégorie.
 * @param {object} req - L'objet requête Express. Contient req.body avec category_name, category_description, category_icon.
 * @param {object} res - L'objet réponse Express.
 */
export const createCategory = async (req, res) => {
    console.log("Attempting to create category..."); // Added for debugging
    const { category_name, category_description, category_icon } = req.body;
    try {
        if (!category_name) {
            return res.status(400).json({ message: "Le nom de la catégorie est obligatoire." });
        }
        const newCategory = await bookModel.insertCategory({ category_name, category_description, category_icon });
        res.status(201).json(newCategory);
    } catch (error) {
        console.error("Erreur dans le contrôleur createCategory :", error.message);
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ message: "Une catégorie avec ce nom existe déjà." });
        }
        res.status(500).json({ message: "Erreur interne du serveur lors de la création de la catégorie." });
    }
};