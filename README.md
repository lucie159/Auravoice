Projet : AuraVoice V1 - Solution d'Analyse Émotionnelle Post-Appel
Document	Spécifications de la Version 1.0
Statut	Déployé & Opérationnel
1. Résumé Exécutif & Impact Métier
AuraVoice est une plateforme SaaS (Software as a Service) conçue pour résoudre le problème de la "boîte noire" dans les centres de contacts. Aujourd'hui, 99% des appels ne sont jamais réécoutés, laissant les managers aveugles sur la qualité réelle des interactions et l'état émotionnel des clients.
Cette version 1.0 déploie une intelligence artificielle capable d'auditer objectivement la charge émotionnelle d'une conversation. En permettant aux agents de s'auto-évaluer et aux superviseurs de détecter les frictions, AuraVoice agit comme un levier direct pour :
Réduire le Churn (perte de clients) en identifiant les appels "Colère".
Améliorer la Formation grâce à des feedbacks basés sur la donnée (Data-Driven).
Moderniser l'Infrastructure grâce à une architecture Cloud découplée.
2. Périmètre Fonctionnel (Ce qui est livré)
Cette version se concentre sur le scénario critique : L'Analyse "Post-Mortem" (Après appel) rapide et détaillée.
2.1 Module d'Authentification Sécurisé
Connexion / Inscription : Interface sécurisée permettant de créer un compte Agent.
Gestion des Rôles : Distinction stricte entre Agent (accès à ses données) et Superviseur (accès aux données d'équipe).
Sécurité : Utilisation de tokens JWT (JSON Web Tokens) pour une session persistante et sécurisée. Les mots de passe sont hachés (Bcrypt) avant stockage.
2.2 Le Moteur d'Analyse 
Upload Universel : Support du Drag & Drop pour les fichiers audio (.wav, .mp3).
Enregistreur Intégré : Possibilité d'enregistrer un appel ou une simulation directement depuis le navigateur via le microphone.
Traitement Intelligent :
Nettoyage Audio : Algorithme de réduction de bruit (noisereduce) pour isoler la voix des bruits parasites.
Détection IA : Classification parmi 7 émotions clés (Colère, Joie, Tristesse, Calme, Anxiété, Surprise).
Logique de Lissage : Algorithme de post-traitement qui filtre les émotions incertaines (<40% de confiance) pour éviter les "faux positifs" et garantir une crédibilité aux résultats.
2.3 Interface de Restitution (Dashboard)
Timeline Visuelle : Restitution graphique de l'analyse. L'utilisateur voit immédiatement quelle émotion dominait.
Lecteur Audio Synchronisé : Permet de réécouter l'appel directement dans l'interface, sans télécharger le fichier.
Statistiques Clés : Affichage clair des pourcentages (ex: "35% de Colère détectée").
Historique : Sauvegarde automatique de tous les rapports dans le Cloud (PostgreSQL).
3. Architecture Technique 
Le projet ne se contente pas de "marcher", il est construit sur des standards industriels modernes et scalables.
3.1 Stack Technologique
Frontend : Next.js 14 (React) avec TypeScript. Interface réactive et typage strict pour éviter les bugs. Hébergé sur Vercel (Global CDN).
Backend : FastAPI (Python). Choisi pour sa rapidité d'exécution et sa compatibilité native avec les librairies d'IA.
Base de Données : PostgreSQL managé sur Supabase. Robuste, relationnel et sécurisé.
Intelligence Artificielle : Modèle TensorFlow/Keras personnalisé. Utilisation de l'extraction de caractéristiques MFCC (Mel-frequency cepstral coefficients) via Librosa.
3.2 DevOps & Déploiement (CI/CD)
C'est un point majeur de différenciation de ce projet :
Conteneurisation : Le Backend est entièrement Dockerisé. Cela garantit que l'environnement (Python, dépendances système comme ffmpeg) est identique en développement et en production.
Hébergement IA : Le backend tourne sur Hugging Face Spaces avec 16 Go de RAM, assurant que le modèle ne crashe pas sous la charge.
Automatisation : Un pipeline GitHub Actions est en place. Chaque modification du code (git push) déclenche automatiquement les tests, la construction de l'image Docker et le déploiement en production.
5. Qualité et Optimisations
Pour répondre aux contraintes du monde réel (et des serveurs gratuits), des optimisations avancées ont été implémentées :
Architecture "Stateless" : Le backend ne garde aucune donnée en mémoire, tout est stocké en base de données ou traité à la volée. Cela permet de redémarrer le serveur à tout moment sans perte de données.
Gestion de la Mémoire (Lazy Loading) : Le modèle d'IA (lourd) n'est chargé en mémoire vive que lors de la première requête ou via un "préchauffage". Cela permet un démarrage rapide du serveur et évite les erreurs de type "Out Of Memory" au lancement.
Gestion des accès concurrents (Async Lock) : Un système de verrouillage asynchrone empêche le serveur de traiter trop d'analyses lourdes simultanément, garantissant la stabilité du service même si plusieurs utilisateurs cliquent en même temps.
6. Conclusion
AuraVoice V1 n'est pas un simple prototype, c'est une brique technologique fonctionnelle. En combinant une interface utilisateur soignée, une architecture Cloud robuste et un modèle d'IA spécialisé, nous avons créé un outil prêt à être testé en conditions réelles pour transformer la gestion de la qualité dans les centres d'appels.
