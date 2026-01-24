## Projet : AuraVoice V1 - Solution d'Analyse Émotionnelle Post-Appel

| **Document** | Spécifications de la Version 1.0 |
| **Statut** | **Déployé & Opérationnel** |

---

### 1. Résumé Exécutif & Impact Métier

**AuraVoice** est une plateforme SaaS (Software as a Service) conçue pour résoudre le problème critique de la "boîte noire" dans les centres de contacts. Actuellement, la grande majorité des appels ne sont jamais réécoutés, laissant les managers aveugles sur la qualité réelle des interactions et l'état émotionnel des clients.

Cette version 1.0 déploie une **intelligence artificielle capable d'auditer objectivement la charge émotionnelle d'une conversation**. En permettant aux agents de s'auto-évaluer et aux superviseurs de détecter les frictions, AuraVoice agit comme un levier direct pour :

1.  **Réduire le Churn (perte de clients)** en identifiant rapidement les interactions conflictuelles ("Colère").
2.  **Améliorer la Montée en Compétence** grâce à des feedbacks basés sur la donnée (Data-Driven).
3.  **Moderniser l'Infrastructure** grâce à une architecture Cloud découplée et évolutive.

---

### 2. Périmètre Fonctionnel (Fonctionnalités Livrées)

Cette version se concentre sur le scénario critique : **L'Analyse "Post-Mortem" (Après appel) rapide et détaillée.**

#### 2.1 Module d'Authentification Sécurisé
*   **Connexion / Inscription :** Interface sécurisée permettant de créer et gérer les comptes utilisateurs.
*   **Gestion des Rôles :** Distinction stricte entre **Agent** (accès à ses propres données) et **Superviseur** (vision globale de l'équipe).
*   **Sécurité :** Utilisation de tokens **JWT (JSON Web Tokens)** pour une session persistante. Les mots de passe sont hachés via **Bcrypt** avant stockage, garantissant la confidentialité des données.

#### 2.2 Le Moteur d'Analyse 
*   **Upload Universel :** Support du Drag & Drop pour les fichiers audio standards (`.wav`, `.mp3`).
*   **Enregistreur Intégré :** Possibilité d'enregistrer un appel ou une simulation directement depuis le navigateur via le microphone.
*   **Traitement Intelligent (Pipeline IA) :**
    *   **Nettoyage Audio :** Algorithme de réduction de bruit (`noisereduce`) pour isoler la voix et éliminer les bruits de fond qui faussent l'analyse.
    *   **Extraction de Caractéristiques :** Transformation du son en données mathématiques (MFCCs) via la librairie Librosa.
    *   **Détection IA :** Classification via un modèle **Deep Learning (TensorFlow)** personnalisé parmi 7 émotions clés (Colère, Joie, Tristesse, Calme, Anxiété, Surprise).
    *   **Logique de Lissage :** Algorithme de post-traitement qui filtre les émotions incertaines (confiance < 40%) pour éviter les "faux positifs" et garantir la crédibilité des résultats.

#### 2.3 Interface de Restitution (Dashboard)
*   **Timeline Visuelle :** Restitution graphique de l'analyse, permettant de voir *immédiatement* quelle émotion dominait l'échange.
*   **Lecteur Audio Synchronisé :** Permet de réécouter l'appel directement dans l'interface, sans avoir besoin de télécharger le fichier.
*   **Statistiques Clés :** Affichage clair des pourcentages (ex: "35% de Colère détectée", "Score de confiance moyen : 85%").
*   **Historique Centralisé :** Sauvegarde automatique de tous les rapports d'analyse dans une base de données Cloud (PostgreSQL) pour un suivi à long terme.

---

### 3. Architecture Technique 

Le projet ne se contente pas de "marcher", il est construit sur des standards industriels modernes pour assurer sa robustesse et sa maintenabilité.

#### 3.1 Stack Technologique
*   **Frontend (Client) :** Développé en **Next.js 14 (React)** avec **TypeScript**. L'interface est réactive, moderne et typée strictement pour minimiser les bugs. Hébergé sur **Vercel** (Global CDN).
*   **Backend (Serveur) :** API REST développée avec **FastAPI (Python)**. Choisi pour sa rapidité d'exécution asynchrone et sa compatibilité native avec l'écosystème IA.
*   **Base de Données :** **PostgreSQL**, hébergé sur **Supabase**. Une solution relationnelle robuste pour la gestion des utilisateurs et des rapports.
*   **Intelligence Artificielle :** Modèle **TensorFlow/Keras** entraîné spécifiquement pour la reconnaissance vocale (SER).

#### 3.2 DevOps & Déploiement (CI/CD)
C'est un point majeur de différenciation technique de ce projet :
*   **Conteneurisation :** Le Backend est entièrement **Dockerisé**. Cela garantit que l'environnement (Python, dépendances système comme ffmpeg) est identique en développement et en production.
*   **Hébergement IA Haute Performance :** Le backend tourne sur **Hugging Face Spaces** (Docker SDK), bénéficiant de 16 Go de RAM pour assurer la fluidité des inférences IA.
*   **Automatisation :** Un pipeline **GitHub Actions** est en place. Chaque modification du code (`git push`) déclenche automatiquement la construction de l'image Docker et le déploiement en production sans intervention humaine.

---

### 4. Qualité et Optimisations Techniques

Pour répondre aux contraintes du monde réel (et des serveurs Cloud gratuits), des optimisations avancées ont été implémentées :

1.  **Architecture "Stateless" :** Le backend ne conserve aucune donnée en mémoire locale ; tout est stocké en base de données ou traité à la volée. Cela assure une scalabilité horizontale et une résilience aux redémarrages.
2.  **Gestion de la Mémoire (Lazy Loading) :** Le modèle d'IA (lourd en ressources) n'est chargé en mémoire vive que lors de la première requête ou via un mécanisme de "préchauffage". Cela permet un démarrage rapide du serveur et évite les erreurs de type "Out Of Memory".
3.  **Gestion des Accès Concurrents (Async Lock) :** Un système de verrouillage asynchrone (`asyncio.Lock`) empêche le serveur de traiter trop d'analyses lourdes simultanément, garantissant la stabilité du service même lors de pics d'utilisation.

---

### 5. Conclusion

AuraVoice V1 n'est pas un simple prototype scolaire, c'est une **brique technologique fonctionnelle et déployée**. En combinant une interface utilisateur soignée, une architecture Cloud robuste (CI/CD, Docker) et un modèle d'IA spécialisé, nous avons créé un outil prêt à démontrer la valeur de l'analyse émotionnelle dans la gestion de la relation client.
