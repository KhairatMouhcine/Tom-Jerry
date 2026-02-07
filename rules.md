# Règles de développement - Projet P5.js Steering Behaviors

## Principes fondamentaux

### Steering Behaviors de Craig Reynolds

- Tous les comportements doivent suivre les principes exposés par Craig Reynolds
- Référence principale : "Steering Behaviors For Autonomous Characters" (1999)
- Lien : https://www.red3d.com/cwr/steer/

### Comportements de base à implémenter

- **Seek** : se diriger vers une cible
- **Flee** : fuir une cible
- **Arrive** : arriver progressivement à une cible (ralentir en approchant)
- **Pursue** : poursuivre une cible mobile (prédiction)
- **Evade** : éviter une cible mobile
- **Wander** : errer de manière aléatoire mais fluide
- **Obstacle Avoidance** : éviter les obstacles
- **Separation** : maintenir une distance avec les voisins
- **Alignment** : s'aligner avec la direction des voisins
- **Cohesion** : se regrouper avec les voisins

## Architecture du code

### Classe Vehicle.js - INTERDICTION DE MODIFICATION

⚠️ **NE JAMAIS modifier Vehicle.js**

Cette classe contient :

- Propriétés de base : position, velocity, acceleration, maxSpeed, maxForce
- Méthodes fondamentales : update(), applyForce(), edges()
- Méthode show() de base
- Méthode applyBehaviors() de base

**Raison** : Vehicle.js est la classe mère stable dont héritent tous les véhicules

### Utilisation de l'héritage

✅ **À faire** : Créer des sous-classes qui héritent de Vehicle

Les sous-classes peuvent :

- Ajouter des propriétés spécifiques
- Surcharger les méthodes show(), applyBehaviors(), update()
- Implémenter des comportements spécialisés

### Organisation des fichiers

```
project/
├── Vehicle.js          # Classe de base (NE PAS MODIFIER)
├── Boid.js            # Sous-classe pour flocking
├── Wanderer.js        # Sous-classe pour wander behavior
├── Pursuer.js         # Sous-classe pour pursuit
├── sketch.js          # Code principal P5.js
└── rules.md           # Ce fichier
```

## Conventions de code

### Système de forces vectorielles

- Tous les comportements retournent un vecteur de force (p5.Vector)
- Les forces sont limitées par maxForce
- Les forces sont combinées par addition vectorielle
- L'accélération est remise à zéro à chaque frame dans update()

### Structure d'un behavior

Chaque méthode de comportement doit :

1. Calculer le vecteur désiré (desired)
2. Calculer le vecteur de steering (différence entre desired et velocity actuelle)
3. Limiter le steering par maxForce
4. Retourner le vecteur de steering

### Pondération des comportements

- Utiliser des poids (weights) pour combiner plusieurs comportements
- Les poids peuvent être des propriétés de la classe ou des paramètres
- Multiplier chaque force par son poids avant de l'appliquer

### Nommage

- Classes : PascalCase (Vehicle, Boid, Wanderer)
- Méthodes de comportement : camelCase (seek, flee, arrive, wander)
- Variables de forces : camelCase descriptif (seekForce, separationForce)
- Constantes : UPPER_SNAKE_CASE si nécessaire

## Optimisation et performance

### Détection de voisinage

- Pour les comportements de groupe (separation, alignment, cohesion)
- Utiliser un rayon de perception pour limiter les calculs
- Ne calculer les distances que dans ce rayon
- Filtrer les voisins avant d'appliquer les comportements

### Quadtree (optionnel pour grands nombres)

- Envisager l'utilisation d'un quadtree si > 200 véhicules
- Améliore les performances pour la détection de voisinage

## Débogage et visualisation

### Mode debug recommandé

- Possibilité d'afficher les vecteurs de force
- Afficher les rayons de perception
- Utiliser des couleurs différentes pour chaque comportement
- Pouvoir activer/désactiver le mode debug avec une touche

### Informations à visualiser

- Vélocité actuelle (vecteur vert)
- Forces appliquées (différentes couleurs)
- Rayon de perception (cercle semi-transparent)
- Target ou objectif (si applicable)

## Spécialisation par sous-classes

### Types de spécialisations possibles

**Boid (flocking)**

- Combine separation, alignment, cohesion
- Nécessite accès à la liste des autres boids
- Utilise un rayon de perception

**Obstacle Avoider**

- Combine seek vers target et avoidance d'obstacles
- Les obstacles ont généralement un poids plus élevé
- Détection anticipée des collisions

**Wanderer**

- Comportement erratique mais fluide
- Utilise un cercle de projection devant le véhicule
- Pas de target fixe

**Pursuer/Evader**

- Prédiction de la position future de la cible
- Calcul basé sur la vélocité de la cible
- Plus efficace que seek/flee simple

## Ressources

### Documentation

- P5.js Vectors : https://p5js.org/reference/#/p5.Vector
- Craig Reynolds : https://www.red3d.com/cwr/steer/
- Nature of Code (Daniel Shiffman) : https://natureofcode.com/autonomous-agents/

### Tutoriels

- The Coding Train - Steering Behaviors : https://thecodingtrain.com/

## Checklist avant commit

- [ ] Aucune modification de Vehicle.js
- [ ] Les nouvelles classes héritent de Vehicle
- [ ] Les comportements retournent des p5.Vector
- [ ] Les forces sont limitées par maxForce
- [ ] Le code respecte les conventions de nommage
- [ ] Les comportements sont documentés
- [ ] Les performances sont acceptables (60 fps visé)
- [ ] Le mode debug est disponible si nécessaire

## Principes de développement

### Séparation des responsabilités

- Vehicle.js : base commune immuable
- Sous-classes : spécialisations et variations
- sketch.js : orchestration et rendu global

### Composition vs. Héritage

- Privilégier la composition de comportements simples
- Éviter les comportements complexes monolithiques
- Chaque behavior doit être testable indépendamment

### Modularité

- Un behavior = une méthode = une responsabilité
- Les behaviors doivent être réutilisables
- Éviter les dépendances entre behaviors
