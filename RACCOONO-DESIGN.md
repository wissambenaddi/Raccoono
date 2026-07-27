# Raccoono — Horizon v1.0.1

## Résumé

Cette version conserve le thème Shopify Horizon 4.1.3 et ajoute une page d’accueil originale, éditoriale, ludique et orientée conversion. Les fonctions natives Horizon restent responsables du header, de la recherche prédictive, des cartes produit, de l’ajout rapide, du panier Ajax, des variantes, de la fiche produit et du footer.

Tous les textes signalés comme temporaires doivent être remplacés par les informations réelles de la marque. Les avis, engagements, délais, comparaisons et politiques ne doivent jamais rester fictifs en production.

## Analyse de la référence

La référence utilise une hiérarchie très verticale : barre d’annonce compacte, navigation blanche, hero panoramique, bande de réassurance, grande grille produit, récit de marque, interaction de personnalité, avis, collections visuelles, comparatif, FAQ et footer sombre.

Son efficacité vient de quatre choix :

- alternance entre grands visuels et respirations blanches ;
- titres expressifs très courts ;
- modules de preuve placés avant et après les produits ;
- plusieurs chemins de conversion sans rendre la page agressive.

La version Raccoono reprend ce rythme et cette architecture, mais pas les logos, textes, personnages, produits, photos, slogans ni illustrations de la référence.

## Direction artistique

Concept : « Raccoono Club », un studio de couvre-chefs pour personnalités difficiles à classer.

Palette :

| Rôle | Couleur |
| --- | --- |
| Crème principal | `#fffaf0` |
| Crème secondaire | `#f4eddf` |
| Bleu nuit | `#071a39` |
| Cyan électrique | `#23d5e9` |
| Cyan profond | `#0aaec3` |
| Corail | `#f06c56` |

Le système associe la police de titre configurée dans Horizon à la police de corps Shopify. Les titres utilisent des tailles fluides, un interlettrage resserré et des lignes courtes. Les boutons sont en pilule, les cartes ont un angle volontairement plus court et les animations respectent `prefers-reduced-motion`.

## Visuels originaux fournis

| Fichier | Usage | Dimensions |
| --- | --- | --- |
| `assets/raccoono-hero-v1.webp` | Hero panoramique | 1983 × 793 |
| `assets/raccoono-studio-v1.webp` | Histoire de marque | 1400 × 933 |
| `assets/raccoono-personalities-v1.webp` | Planche de personnalité | 1983 × 793 |
| `assets/raccoono-profile-calm-v1.webp` | Profil calme | 700 × 700 |
| `assets/raccoono-profile-curious-v1.webp` | Profil curieux | 700 × 700 |
| `assets/raccoono-profile-bold-v1.webp` | Profil audacieux | 700 × 700 |
| `assets/raccoono-profile-chaos-v1.webp` | Profil chaotique | 700 × 700 |

Ces images ont été créées pour ce projet, sans texte, logo ou marque tierce. Elles servent de contenus de démonstration et peuvent être remplacées dans l’éditeur Shopify.

## Architecture de la page

1. Annonces Horizon avec trois messages temporaires.
2. Header Horizon sticky et transparent sur l’accueil.
3. Hero Raccoono avec image mobile, overlay et deux appels à l’action.
4. Réassurance en blocs.
5. Produits vedettes natifs Horizon.
6. Mission de marque.
7. Histoire de marque et visuel d’atelier.
8. Curseur de personnalité accessible.
9. Témoignages manuels ou emplacement d’application.
10. Collections en mosaïque.
11. Tableau comparatif responsive.
12. Galerie UGC manuelle avec modale native.
13. FAQ avec `details`, `summary` et JSON-LD optionnel.
14. Newsletter Shopify avec consentement.
15. Footer Horizon sombre.

## Fichiers personnalisés

- `snippets/raccoono-icon.liquid`
- `sections/raccoono-hero.liquid`
- `sections/raccoono-trust.liquid`
- `sections/raccoono-editorial.liquid`
- `sections/raccoono-personality.liquid`
- `sections/raccoono-testimonials.liquid`
- `sections/raccoono-collection-showcase.liquid`
- `sections/raccoono-comparison.liquid`
- `sections/raccoono-ugc.liquid`
- `sections/raccoono-faq.liquid`
- `sections/raccoono-newsletter.liquid`
- `templates/index.json`
- `sections/header-group.json`
- `sections/footer-group.json`

Les données éditoriales sont gérées par les réglages et blocs du thème. Aucun metafield ou metaobject n’est nécessaire pour cette première version ; cela évite de créer une dépendance de données inutile.

## Personnalisation dans Shopify

Dans **Boutique en ligne → Thèmes → Personnaliser** :

1. remplacez le logo et vérifiez sa version inversée ;
2. sélectionnez le menu principal ;
3. remplacez les trois annonces temporaires ;
4. connectez la collection des produits vedettes ;
5. sélectionnez les collections de la mosaïque ;
6. remplacez la mission, l’histoire et tous les engagements temporaires ;
7. configurez les quatre profils et leurs liens ;
8. remplacez les témoignages uniquement par de vrais avis ou branchez l’application d’avis ;
9. remplacez la galerie par des médias clients autorisés ;
10. corrigez les délais, retours, tailles et réponses FAQ ;
11. adaptez le consentement newsletter et les politiques ;
12. ajoutez les vraies URL sociales.

## Prévisualisation et installation

Depuis le dossier du thème :

```bash
shopify theme check
shopify theme dev --store votre-boutique.myshopify.com --open
```

Pour créer une copie non publiée :

```bash
shopify theme push --store votre-boutique.myshopify.com --unpublished --strict
```

Vérifiez toujours le lien de prévisualisation avant de publier. Pour revenir en arrière, gardez le thème précédent non publié ou utilisez l’historique Git de la branche.

## Checklist

- Tester 320, 375, 430, 768, 1024, 1280 et 1440 px.
- Vérifier navigation clavier, focus visible, Échap, tiroirs et modales.
- Tester le curseur avec les flèches du clavier.
- Tester l’ajout rapide, le compteur, les quantités et le panier vide.
- Tester produits sans image, épuisés et à variantes multiples.
- Remplacer tous les contenus marqués « temporaire », « démonstration », « à confirmer » ou entre crochets.
- Vérifier les contrastes après chaque changement de couleur.
- Vérifier les alt des images marchandes.
- Tester la newsletter et ses messages d’erreur/succès.
- Désactiver les données structurées FAQ si la FAQ n’est pas réellement affichée.
- Lancer `shopify theme check` avant chaque push.

## Audit final

La personnalisation utilise HTML sémantique, images responsives, chargement différé sous la ligne de flottaison, JavaScript natif isolé dans des Custom Elements, contrôles tactiles de 44 px minimum et repli sans JavaScript pour les contenus essentiels. Les visuels WebP fournis pèsent environ 45 à 110 Ko chacun. Le thème conserve les composants Horizon éprouvés pour les parcours transactionnels.
