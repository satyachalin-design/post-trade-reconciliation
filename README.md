# Réconciliation Post-Trade Front Office / Back Office

Script Google Apps Script qui automatise le rapprochement quotidien des transactions entre le Front Office et le Back Office, et génère un rapport d'écarts en un clic.

**Résultat** : un contrôle qui prenait environ 2h de vérification manuelle est ramené à 30 secondes, avec 100% des lignes comparées (contre un contrôle visuel partiel et sujet à l'oubli).

## Le problème

Chaque jour, les transactions saisies côté Front Office doivent être rapprochées de leur confirmation côté Back Office. Fait à la main, ce contrôle est long, répétitif, et un écart de saisie (quantité, prix, sens) ou une transaction oubliée d'un côté passe facilement inaperçu — un risque opérationnel classique en post-trade.

## La solution

Un script qui compare automatiquement les deux feuilles, ligne par ligne :

1. **Lecture des feuilles FO et BO**, stockées dans des dictionnaires JavaScript pour un accès instantané (`O(1)`) plutôt qu'une recherche linéaire répétée
2. **Clé unique d'appariement** : `Trade ID | ISIN | Date Transaction`, pour associer sans ambiguïté chaque transaction entre les deux feuilles
3. **4 contrôles** : quantité, prix unitaire, montant, sens (achat/vente) — plus la détection des transactions présentes d'un seul côté
4. **Rapport généré automatiquement** dans une feuille dédiée "Écarts", avec le détail de chaque anomalie, et une notification avec le nombre total d'écarts trouvés

Le script est relié à un bouton dans la feuille : la réconciliation se lance en un clic, sans ouvrir l'éditeur de script.

## Exemple de résultat

Sur un jeu de données simulé de 100 transactions FO / 96 transactions BO, le script détecte **25 anomalies** :

| Type d'écart | Nombre |
|---|---|
| Écarts de champs (quantité, prix, montant ou sens) | 9 |
| Transactions manquantes en Back Office | 6 |
| Transactions manquantes en Front Office | 10 |

## Fichiers

| Fichier | Description |
|---|---|
| `reconciliation.gs` | Le script Apps Script complet |
| `exemple_donnees.xlsx` | Jeu de données simulé (feuilles FO, BO, et Écarts généré) |

## Comment l'utiliser

1. Ouvrir un Google Sheets avec deux feuilles nommées `FO` et `BO`, structurées avec les colonnes : Trade ID, Date Transaction, Date Règlement, ISIN, Titre, Ticker, Sens, Quantité, Prix Unitaire, Montant, Devise, Contrepartie, Trader
2. Aller dans **Extensions > Apps Script**, coller le contenu de `reconciliation.gs`
3. Revenir dans la feuille, ajouter un bouton (Insertion > Dessin), puis clic droit sur le dessin > **Attribuer un script** > `reconciliationPostTrade`
4. Cliquer sur le bouton : la feuille "Écarts" est générée automatiquement

## Points techniques

- **Pourquoi des dictionnaires plutôt qu'une double boucle** : comparer deux listes de 100 lignes avec une recherche imbriquée coûterait jusqu'à 100×100 comparaisons. En indexant chaque feuille dans un dictionnaire par clé unique, l'appariement se fait en une seule passe sur chaque feuille.
- **Nettoyage des montants** : les montants peuvent être saisis avec des formats différents (virgule décimale, symbole de devise, espaces). La fonction `cleanNumber()` normalise ces valeurs avant comparaison, pour éviter de détecter de faux écarts dus au formatage plutôt qu'au contenu.
- **Idempotence** : relancer le script supprime et recrée la feuille "Écarts" à chaque exécution, pour toujours refléter l'état le plus récent sans accumulation d'anciens rapports.

---
*Projet réalisé dans le cadre d'une recherche de stage/alternance en finance de marché (front office, produits structurés, trading).*
