// routes/bookRoutes.js
import express from "express";
import {
    createBook,
    getAllBooks,
    getBooksByCategory,
    getBookDetails,
    updateBook,
    searchBooks,
    deleteBook,
    postBookComment,
    getAllCategories,
    createCategory
} from "../controllers/bookController.js";
import { registerUser } from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
const router = express.Router();
// Routes les plus spécifiques en premier
router.get("/search", searchBooks); // GET /api/books/search?title=...&price=...
router.get("/category/:categoryName", getBooksByCategory); // GET /api/books/category/:categoryName
// Routes plus génériques après
router.post("/", createBook); // POST /api/books (pour créer)
router.get("/", getAllBooks); // GET /api/books (pour tous les livres)
router.get("/categories", getAllCategories); // GET /api/books/categories (pour toutes les catégories)
router.post("/categories", createCategory); // POST /api/books/categories (pour créer une catégorie)
// Routes avec ID paramétré (moins spécifiques que celles au-dessus)
router.get("/:bookId", getBookDetails); // GET /api/books/:bookId (pour les détails d'un seul livre)
router.put("/:bookId", updateBook); // PUT /api/books/:bookId (pour modifier un livre)
router.delete("/:bookId", deleteBook); 
router.post("/:bookId/comments", authenticateToken, postBookComment);
export default router;


