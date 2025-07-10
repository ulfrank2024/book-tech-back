
# BOOK-tech API Backend

![Node.js](https://img.shields.io/badge/Node.js-18.x-green?style=for-the-badge&logo=node.js)
![Express.js](https://img.shields.io/badge/Express.js-4.x-blue?style=for-the-badge&logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13.x-blue?style=for-the-badge&logo=postgresql)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange?style=for-the-badge&logo=json-web-tokens)
![Nodemon](https://img.shields.io/badge/Nodemon-2.x-red?style=for-the-badge&logo=nodemon)

Bienvenue dans le backend de l'API BOOK-tech, une application de gestion de livres électroniques. Cette API est construite avec **Node.js**, **Express**, et **PostgreSQL**, offrant un ensemble robuste de fonctionnalités pour l'authentification des utilisateurs, la gestion des livres, le panier d'achat, les likes et les commentaires.

---

## Table des matières

* [Fonctionnalités](#fonctionnalités)
* [Prérequis](#prérequis)
* [Installation](#installation)
* [Configuration de la base de données](#configuration-de-la-base-de-données)
* [Variables d'environnement](#variables-denvironnement)
* [Démarrage du projet](#démarrage-du-projet)
* [Structure des dossiers](#structure-des-dossiers)
* [Endpoints de l'API](#endpoints-de-lapi)
* [Déploiement](#déploiement)
* [Contribuer](#contribuer)
* [License](#license)

---

## Fonctionnalités

* **Authentification Utilisateur :** Inscription, connexion et gestion de profil sécurisée avec JWT.
* **Gestion des Livres :** Affichage détaillé des livres, recherche et filtrage par catégorie.
* **Panier d'Achat :** Ajout, modification de quantité et suppression d'articles dans le panier.
* **Achat de Livres :** Association de livres achetés au profil utilisateur.
* **Likes de Livres :** Les utilisateurs peuvent "liker" des livres, avec un décompte des likes par livre.
* **Commentaires de Livres :** Les utilisateurs peuvent poster des commentaires sur les livres et voir les commentaires existants.
* **Base de données PostgreSQL :** Stockage robuste et relationnel des données.

---

## Prérequis

Assurez-vous d'avoir les éléments suivants installés sur votre machine :

* **Node.js :** Version 18 ou supérieure.
* **npm :** npm est généralement installé avec Node.js.
* **PostgreSQL :** Un serveur de base de données PostgreSQL en cours d'exécution.
* **Git :** Pour cloner le dépôt.
=======
