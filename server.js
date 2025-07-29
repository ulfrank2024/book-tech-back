// server.js
import "dotenv/config"; // Importe dotenv et charge les variables. Nouvelle syntaxe pour ça.
import express from "express";
import cors from "cors";
// Importe les routes (note l'extension .js, c'est important pour les modules ES)
// import userRoutes from "./routes/userRoutes.js";
import bookRoutes from "./routes/bookRoutes.js"
// import authRoutes from "./routes/authRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import checkoutRoutes from "./routes/checkoutRoutes.js";
import adminRoutes from "./routes/AdminRoute.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3005', 'http://localhost:3006'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));
app.use(express.json());

// Utilise les routes


app.use("/api/books", bookRoutes);
app.use("/api/auth", authRoutes); 
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/admin", adminRoutes); // Nouvelle route pour l'administration

// Route de test simple
app.get("/", (req, res) => {
    res.send("Bienvenue sur l'API Book-Tech !");
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
