# Modèle de données Impact — Raccoono

Ce document accompagne le thème `horizon-v1.0.2`. Le thème n’invente aucun montant, partenaire ou résultat. Les réglages de section servent de repli éditorial ; en production, les preuves peuvent être reliées à des sources dynamiques Shopify.

## 1. Définir le modèle avant d’écrire les données

Les définitions app-owned suivantes sont à déclarer dans l’application qui gère l’impact, puis à déployer avec Shopify CLI. Elles ne doivent pas être ajoutées au paquet du thème.

```toml
[metaobjects.app.impact_partner]
name = "Partenaire impact"
display_name_field = "name"

[metaobjects.app.impact_partner.fields.name]
name = "Nom"
type = "single_line_text_field"
required = true

[metaobjects.app.impact_partner.fields.website]
name = "Site officiel"
type = "url"

[metaobjects.app.impact_partner.fields.description]
name = "Description vérifiée"
type = "multi_line_text_field"

[metaobjects.app.impact_project]
name = "Projet forestier"
display_name_field = "title"

[metaobjects.app.impact_project.fields.title]
name = "Titre"
type = "single_line_text_field"
required = true

[metaobjects.app.impact_project.fields.partner]
name = "Partenaire"
type = "metaobject_reference<$app:impact_partner>"

[metaobjects.app.impact_project.fields.action_type]
name = "Type d’action"
type = "single_line_text_field"

[metaobjects.app.impact_project.fields.period]
name = "Période"
type = "single_line_text_field"

[metaobjects.app.impact_payment]
name = "Versement"
display_name_field = "reference"

[metaobjects.app.impact_payment.fields.reference]
name = "Référence"
type = "single_line_text_field"
required = true

[metaobjects.app.impact_payment.fields.amount]
name = "Montant"
type = "money"
required = true

[metaobjects.app.impact_payment.fields.paid_at]
name = "Date de versement"
type = "date"
required = true

[metaobjects.app.impact_payment.fields.project]
name = "Projet"
type = "metaobject_reference<$app:impact_project>"

[metaobjects.app.impact_update]
name = "Mise à jour"
display_name_field = "title"

[metaobjects.app.impact_update.fields.title]
name = "Titre"
type = "single_line_text_field"

[metaobjects.app.impact_update.fields.published_at]
name = "Date"
type = "date"

[metaobjects.app.impact_update.fields.body]
name = "Contenu"
type = "rich_text_field"

[metaobjects.app.impact_document]
name = "Justificatif"
display_name_field = "title"

[metaobjects.app.impact_document.fields.title]
name = "Titre"
type = "single_line_text_field"

[metaobjects.app.impact_document.fields.file]
name = "Fichier"
type = "file_reference"

[product.metafields.app.impact_eligible]
name = "Produit éligible"
type = "boolean"

[product.metafields.app.contribution_amount]
name = "Montant reversé"
type = "money"

[product.metafields.app.contribution_rate]
name = "Pourcentage reversé"
type = "number_decimal"

[product.metafields.app.contribution_basis]
name = "Base de calcul"
type = "single_line_text_field"
```

## 2. Écrire les valeurs

Créer ou mettre à jour les entrées avec `metaobjectUpsert`, puis relier les références avec `metafieldsSet`. Les opérations doivent être idempotentes et journaliser la période, la source et l’identifiant du justificatif.

```graphql
mutation UpsertImpactPayment($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
  metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
    metaobject { id handle updatedAt }
    userErrors { field message code }
  }
}
```

```graphql
mutation SetProductImpact($metafields: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafields) {
    metafields { id namespace key type updatedAt }
    userErrors { field message code }
  }
}
```

## 3. Lire et publier

L’application peut lire les metaobjects via l’Admin GraphQL API pour générer les bilans. Le storefront doit n’exposer que les définitions autorisées pour `PUBLIC_READ`, et le thème doit afficher les montants avec les filtres monétaires Shopify ou `metafield_tag`.

La section `Raccoono — Impact` fournit une interface de repli configurable. Le bloc `Raccoono — Impact produit` lit les metafields `custom.impact_eligible`, `custom.contribution_amount`, `custom.contribution_rate` et `custom.contribution_basis`. Si l’application utilise le namespace app-owned `$app`, adaptez ces quatre lectures dans le bloc lors de l’installation.

## 4. Règles éditoriales

- Ne jamais publier une contribution avant validation du partenaire, de la période et de la base de calcul.
- Marquer toute donnée de démonstration comme temporaire.
- Conserver une archive immuable des versements et justificatifs.
- Distinguer plantation, régénération naturelle et restauration forestière.
- Documenter les limites : un achat ne « sauve » pas automatiquement une forêt.
