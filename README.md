# Convertisseur d'Échelle

Application web single-page (PWA) permettant de convertir des mesures entre un plan et la réalité, en centimètres et en mètres.

## Fonctionnalités

- Conversion bidirectionnelle plan ↔ réalité
- Unités métriques uniquement : `cm` et `m`
- Échelles prédéfinies (1:1 à 1:50 000) et échelle personnalisée
- Table de référence dynamique avec mise en évidence de la valeur la plus proche
- Installable comme application (PWA) avec fonctionnement hors ligne

## Utilisation

Servir les fichiers via un serveur HTTP local :

```bash
python3 -m http.server 8080
```

Ouvrir ensuite [http://localhost:8080](http://localhost:8080) dans un navigateur.

## Structure

```
├── index.html        Page principale (Bootstrap 5.3)
├── style.css         Styles
├── app.js            Logique de conversion
├── manifest.json     Manifeste PWA
├── sw.js             Service Worker (cache hors ligne)
└── icons/            Icônes SVG
```