import pool from "../db/db.js";
/**
 * Insère un nouveau livre dans la base de données.
 * @param {object} bookData - Un objet contenant toutes les données du livre à insérer.
 * @returns {Promise<object>} Le livre inséré avec son ID généré.
 */
export const insertBook = async (bookData) => {
    const {
        title,
        author_name,
        category_id,
        price,
        description,
        cover_image_url,
        book_file_url,
        availability,
        rating,
        format,
        file_size_mb,
    } = bookData;
    try {
        const result = await pool.query(
            `INSERT INTO Books (
                title,
                author_name,
                category_id,
                price,
                description,
                cover_image_url,
                book_file_url,
                availability,
                rating,
                format,
                file_size_mb
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;`,
            [
                title,
                author_name,
                category_id,
                price,
                description,
                cover_image_url,
                book_file_url,
                availability,
                rating,
                format,
                file_size_mb,
            ]
        );
        return result.rows[0]; 
    } catch (error) {
        throw error;
    }
};
/**
 * Récupère tous les livres de la base de données.
 * @returns {Promise<Array>} Un tableau de tous les livres.
 */
export const findAllBooks = async () => {
    try {
        const result = await pool.query("SELECT * FROM Books;");
        return result.rows;
    } catch (error) {
        throw error;
    }
};

/**
 * Récupère les livres d'une catégorie spécifique par son nom, en incluant l'ID et le nom de la catégorie.
 * @param {string} categoryName - Le nom de la catégorie (ex: 'Fantasy').
 * @returns {Promise<Array>} Un tableau de livres appartenant à cette catégorie.
 */
export const findBooksByCategoryName = async (categoryName) => {
    try {
        const result = await pool.query(
            `SELECT
             b.* , bc.category_name
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
/**
 * Récupère un livre spécifique par son ID.
 * @param {string} bookId - L'ID UUID du livre.
 * @returns {Promise<object | undefined>} Le livre trouvé, ou undefined si non trouvé.
 */
export const findBookById = async (bookId) => {
    try {
        const result = await pool.query(
            `SELECT
             b.*, bc.category_name AS category_name_string
             FROM Books b
             JOIN BookCategories bc ON b.category_id = bc.category_id
             WHERE b.book_id = $1;`, 
            [bookId]
        );
        return result.rows[0]; 
    } catch (error) {
        console.error("Erreur dans bookModel.findBookById:", error.message);
        throw error;
    }
};

/**
 * Met à jour un livre existant dans la base de données.
 * @param {string} bookId - L'ID UUID du livre à mettre à jour.
 * @param {object} bookData - Un objet contenant les champs du livre à mettre à jour.
 * @returns {Promise<object | undefined>} Le livre mis à jour, ou undefined si non trouvé.
 */
export const updateBookById = async (bookId, bookData) => {
    const fieldsToUpdate = [];
    const values = [bookId];
    let paramIndex = 2; 
    for (const key in bookData) {
        if (bookData.hasOwnProperty(key) && key !== 'book_id') {
            fieldsToUpdate.push(`${key} = $${paramIndex}`);
            values.push(bookData[key]);
            paramIndex++;
        }
    }
    if (fieldsToUpdate.length === 0) {
        return undefined;
    }
    const queryText = `
        UPDATE Books
        SET ${fieldsToUpdate.join(', ')}
        WHERE book_id = $1
        RETURNING *;
    `;
    try {
        const result = await pool.query(queryText, values);
        return result.rows[0];
    } catch (error) {
        console.error("Erreur dans bookModel.updateBookById:", error.message);
        throw error;
    }
};
/**
 * Recherche des livres en fonction de critères de filtre (titre, prix max).
 * @param {object} filters - Un objet contenant les critères de recherche (ex: { title: 'dune', maxPrice: 20 }).
 * @param {string} [filters.title] - Le titre ou une partie du titre à rechercher.
 * @param {number} [filters.maxPrice] - Le prix maximum du livre à rechercher.
 * @returns {Promise<Array>} Un tableau de livres correspondant aux critères de recherche.
 */
export const searchBooks = async (filters) => {
    const { title, maxPrice } = filters;
    let queryText = `
        SELECT
            b.book_id,
            b.title,
            b.author_name,
            b.category_id,
            b.price,
            b.creation_date,
            b.description,
            b.cover_image_url,
            b.book_file_url,
            b.availability,
            b.rating,
            b.format,
            b.file_size_mb,
            bc.category_name AS category_name_string
        FROM Books b
        JOIN BookCategories bc ON b.category_id = bc.category_id
    `;
    const queryParams = [];
    const conditions = [];
    let paramIndex = 1;
    if (title) {
        conditions.push(`b.title ILIKE $${paramIndex}`);
        queryParams.push(`%${title}%`);
        paramIndex++;
    }

    if (maxPrice !== undefined && maxPrice !== null) { 
        conditions.push(`b.price <= $${paramIndex}`); 
        queryParams.push(maxPrice);
        paramIndex++;
    }
    if (conditions.length > 0) {
        queryText += ` WHERE ${conditions.join(' AND ')}`; 
    }
    queryText += ` ORDER BY b.title ASC;`; 
    try {
        const result = await pool.query(queryText, queryParams);
        return result.rows;
    } catch (error) {
        console.error("Erreur dans bookModel.searchBooks:", error.message);
        throw error;
    }
};
/**
 * Supprime un livre de la base de données par son ID.
 * @param {string} bookId - L'ID UUID du livre à supprimer.
 * @returns {Promise<number>} Le nombre de lignes supprimées (0 si non trouvé, 1 si supprimé).
 */
export const deleteBookById = async (bookId) => {
    try {
        const result = await pool.query(
            `DELETE FROM Books WHERE book_id = $1;`,
            [bookId]
        );
        return result.rowCount; // Retourne le nombre de lignes affectées (0 ou 1)
    } catch (error) {
        console.error("Erreur dans bookModel.deleteBookById:", error.message);
        throw error;
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
export const findAllCategories = async () => {
    try {
        const result = await pool.query("SELECT category_id, category_name, category_description, category_icon FROM BookCategories ORDER BY category_name ASC;");
        return result.rows;
    } catch (error) {
        console.error("Erreur dans bookModel.findAllCategories:", error.message);
        throw error;
    }
};