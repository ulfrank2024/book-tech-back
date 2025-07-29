import "dotenv/config";
import bcrypt from 'bcryptjs';
import { insertUser, findUserByEmail, findRoleByName } from '../models/userModel.js';
import pool from '../db/db.js'; // Importez le pool de connexion à la base de données

async function createAdmin() {
  const adminEmail = 'admin1@example.com'; // CHANGEZ CET EMAIL
  const adminPassword = '123qwe'; // CHANGEZ CE MOT DE PASSE

  try {
    // Vérifier si le rôle 'Admin' existe
    let adminRole = await findRoleByName('Admin');
    if (!adminRole) {
      console.error(`Erreur: Le rôle "Admin" n'existe pas dans la base de données. Veuillez le créer manuellement d'abord.`);
      console.error(`Exécutez cette requête SQL: INSERT INTO Roles (role_name) VALUES ('Admin');`);
      return;
    }

    // Vérifier si un utilisateur avec cet email existe déjà
    const existingAdmin = await findUserByEmail(adminEmail);
    if (existingAdmin) {
      console.log(`Un utilisateur administrateur existe déjà avec l'email ${adminEmail}.`);
      return;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Créer le nouvel utilisateur administrateur
    const newAdminData = {
      first_name: 'ulrich',
      last_name: 'franklin',
      email: adminEmail,
      password_hash: hashedPassword,
      role_id: adminRole.role_id,
    };

    await insertUser(newAdminData);
    console.log(`Utilisateur administrateur créé avec succès: ${adminEmail}`);

  } catch (error) {
    console.error(`Erreur lors de la création de l'utilisateur administrateur:`, error);
  } finally {
    // Fermer la connexion à la base de données après l'opération
    if (pool && pool.end) {
      await pool.end();
      console.log('Connexion à la base de données fermée.');
    }
  }
}

createAdmin();
