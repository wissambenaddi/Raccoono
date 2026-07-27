# Raccoono — Horizon v1.0.2

## Résumé

Cette version conserve Shopify Horizon 4.1.3 et transforme la direction artistique en boutique éditoriale dédiée au soutien d’actions de restauration et de réhabilitation de forêts touchées par les incendies en France.

Les fonctions transactionnelles natives Horizon restent responsables du header, de la recherche, des cartes produit, de l’ajout rapide, du panier Ajax, des variantes, de la fiche produit et du footer. Les nouvelles sections ajoutent le récit de marque, les informations d’impact et une mascotte originale cohérente.

## Direction artistique

Le concept associe 80 % de calme, de lisibilité et d’espace négatif à 20 % d’illustration et d’humour. Un seul raton laveur revient dans les visuels : curieux, légèrement maladroit et optimiste, mais jamais infantilisant. Il accompagne le parcours sans réduire la gravité des incendies ni remplacer les informations factuelles.

| Rôle | Couleur |
| --- | --- |
| Crème | `#F7F1E6` |
| Blanc cassé | `#FCFAF6` |
| Bleu nuit | `#09203F` |
| Turquoise doux | `#25C7D9` |
| Vert forêt | `#2F5B43` |
| Corail | `#EF725F` |
| Jaune doux | `#F2C65D` |
| Gris brun | `#5C5A55` |

Les titres utilisent la police de titre configurée dans Horizon avec des tailles fluides. La police de corps Shopify reste prioritaire pour les prix, politiques, formulaires et informations d’impact.

## Visuels originaux

| Fichier | Usage | Dimensions |
| --- | --- | --- |
| `assets/raccoono-forest-hero-v2.webp` | Hero forestier | 1672 × 941 |
| `assets/raccoono-forest-mission-v2.webp` | Mission et page Impact | 1448 × 1086 |
| `assets/raccoono-forest-personalities-v2.webp` | Planche des quatre profils | 1774 × 887 |
| `assets/raccoono-profile-discreet-v2.webp` | Profil discret | 720 × 720 |
| `assets/raccoono-profile-curious-v2.webp` | Profil curieux | 720 × 720 |
| `assets/raccoono-profile-motivated-v2.webp` | Profil motivé | 720 × 720 |
| `assets/raccoono-profile-chaotic-v2.webp` | Profil chaotique | 720 × 720 |
| `assets/raccoono-forest-newsletter-v2.webp` | Newsletter | 1536 × 1024 |
| `assets/raccoono-forest-404-v2.webp` | Page 404 | 1448 × 1086 |

Les images ne contiennent ni texte, ni logo, ni marque tierce. Tous les textes restent en HTML afin d’être modifiables, accessibles et traduisibles.

## Architecture

1. Annonces Horizon factuelles.
2. Header Horizon sticky et transparent sur l’accueil.
3. Hero illustré avec deux appels à l’action.
4. Trois avantages : livraison, contribution, emballage.
5. Produits vedettes Horizon.
6. Mission de marque.
7. Quatre étapes du panier aux preuves.
8. Curseur accessible des quatre personnalités.
9. Avis de démonstration explicitement signalés.
10. Collections mises en avant.
11. Tableau comparatif prudent.
12. Galerie communautaire avec contenus autorisés.
13. FAQ native.
14. Newsletter Shopify illustrée.
15. Footer Horizon sombre.

Les pages complémentaires comprennent une fiche produit avec bloc d’impact, un panier latéral sans estimation fictive, un template `page.impact.json` et une page 404 illustrée.

## Transparence et données

La page Impact ne publie aucun montant, partenaire ou versement par défaut. Les réglages `contribution_verified`, `contribution_mode`, la base de calcul, la période et les produits éligibles doivent être complétés avant activation.

Les montants saisis dans les réglages sont exprimés en unité mineure puis rendus avec `money_with_currency`. Le bloc produit peut lire :

- `custom.impact_eligible`
- `custom.contribution_amount`
- `custom.contribution_rate`
- `custom.contribution_basis`

Le modèle conseillé pour les partenaires, projets, versements, documents et mises à jour se trouve dans `docs/impact-data-model.md`. Les définitions app-owned doivent être créées par l’application qui gère les données, pas par le thème.

## Greenwashing : règles de publication

- Ne jamais écrire qu’un achat sauve une forêt.
- Ne jamais associer automatiquement une commande à un arbre.
- Publier le montant ou pourcentage, la base de calcul, la période et les produits éligibles.
- Nommer le bénéficiaire complet et lier sa source officielle.
- Archiver dates, montants et justificatifs de versement.
- Expliquer les limites et distinguer plantation, régénération naturelle et restauration.
- Laisser les étiquettes « à confirmer » tant que les preuves ne sont pas disponibles.

## Personnalisation

Dans **Boutique en ligne → Thèmes → Personnaliser** :

1. créez une page Shopify nommée `Impact` avec le handle `impact` ;
2. assignez-lui le modèle `page.impact` ;
3. complétez le mécanisme, la période, les produits, le partenaire et les limites ;
4. n’activez `Les données publiées sont vérifiées` qu’après contrôle ;
5. remplacez les projets, versements, justificatifs et mises à jour temporaires ;
6. ajoutez la page Impact aux menus du header et du footer ;
7. connectez la collection des produits vedettes et les collections éditoriales ;
8. remplacez les avis uniquement par de vrais avis ou branchez une application ;
9. remplacez la galerie par des contenus clients autorisés ;
10. complétez les politiques de livraison, retour, fabrication et confidentialité.

## Validation

Depuis le dossier du thème :

```bash
shopify theme check
shopify theme dev --store votre-boutique.myshopify.com --open
```

Tester au minimum 320, 375, 430, 768, 1024, 1280 et 1440 px, la navigation clavier, les focus, le panier vide, les variantes, les produits sans image, les montants multidevises et les états temporaires de la page Impact.
