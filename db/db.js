import pg from "pg"; 
const { Pool } = pg; 

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect((err, client, done) => {
    if (err) {
        console.error("Erreur de connexion à la base de données", err.stack);
    } else {
        console.log("Connecté à la base de données PostgreSQL !");
    }
});

export default pool; 
