/**
 * Réconciliation post-trade Front Office / Back Office
 * -----------------------------------------------------
 * Compare les transactions de deux feuilles Google Sheets ("FO" et "BO"),
 * détecte les écarts (quantité, prix, montant, sens) et les transactions
 * manquantes d'un côté ou de l'autre, puis génère un rapport dans une
 * feuille "Écarts".
 *
 * Clé d'appariement : Trade ID | ISIN | Date Transaction
 *
 * Usage : associer cette fonction à un bouton dans la feuille
 * (Insertion > Dessin, puis clic droit > Attribuer un script
 * > "reconciliationPostTrade").
 */
function reconciliationPostTrade() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const wsFO = ss.getSheetByName("FO");
  const wsBO = ss.getSheetByName("BO");

  // Supprimer la feuille "Écarts" si elle existe
  let wsResult = ss.getSheetByName("Écarts");
  if (wsResult) {
    ss.deleteSheet(wsResult);
  }

  // Créer une nouvelle feuille "Écarts"
  wsResult = ss.insertSheet("Écarts");

  // Écrire les en-têtes du rapport
  wsResult.appendRow([
    "Trade ID", "Date Transaction", "ISIN", "Quantité FO", "Quantité BO", "Écart Quantité",
    "Prix Unitaire FO", "Prix Unitaire BO", "Écart Prix", "Montant FO", "Montant BO", "Écart Montant",
    "Sens FO", "Sens BO", "Type d'écart"
  ]);

  // Mise en forme des en-têtes
  wsResult.getRange("A1:O1").setFontWeight("bold");
  wsResult.getRange("A1:O1").setBackground("#CCCCCC");

  // Définir la largeur des colonnes A à O (1 à 15)
  for (let i = 1; i <= 15; i++) {
    wsResult.setColumnWidth(i, 120);
  }

  // Fonction pour nettoyer et convertir une valeur en nombre
  function cleanNumber(value) {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      // Remplacer les virgules par des points et supprimer les symboles (€, $, espaces)
      const cleanedValue = value.replace(/[^0-9.-]/g, '').replace(',', '.');
      return cleanedValue === '' ? 0 : parseFloat(cleanedValue);
    }
    return 0;
  }

  // Lire les données FO et les stocker dans un dictionnaire
  const foData = {};
  const foValues = wsFO.getRange(2, 1, wsFO.getLastRow() - 1, 13).getValues();

  for (const row of foValues) {
    const tradeID = row[0];
    const dateTransaction = row[1];
    const isin = row[3];
    const sens = row[6];

    // Nettoyer et convertir les valeurs numériques
    const qty = cleanNumber(row[7]);
    const prix = cleanNumber(row[8]);
    const montant = cleanNumber(row[9]);

    const key = `${tradeID}|${isin}|${dateTransaction}`;
    foData[key] = { tradeID, dateTransaction, isin, qty, prix, montant, sens };
  }

  // Lire les données BO et les stocker dans un dictionnaire
  const boData = {};
  const boValues = wsBO.getRange(2, 1, wsBO.getLastRow() - 1, 13).getValues();

  for (const row of boValues) {
    const tradeID = row[0];
    const dateTransaction = row[1];
    const isin = row[3];
    const sens = row[6];

    // Nettoyer et convertir les valeurs numériques
    const qty = cleanNumber(row[7]);
    const prix = cleanNumber(row[8]);
    const montant = cleanNumber(row[9]);

    const key = `${tradeID}|${isin}|${dateTransaction}`;
    boData[key] = { tradeID, dateTransaction, isin, qty, prix, montant, sens };
  }

  // Comparer les transactions entre FO et BO
  let rowResult = [];

  // Parcourir les transactions du BO pour trouver les écarts
  for (const key in boData) {
    const bo = boData[key];
    if (foData[key]) {
      const fo = foData[key];
      const discrepancies = [];

      if (fo.qty !== bo.qty) discrepancies.push("Quantité");
      if (fo.prix !== bo.prix) discrepancies.push("Prix Unitaire");
      if (fo.montant !== bo.montant) discrepancies.push("Montant");
      if (fo.sens !== bo.sens) discrepancies.push("Sens");

      if (discrepancies.length > 0) {
        rowResult.push([
          bo.tradeID, bo.dateTransaction, bo.isin,
          fo.qty, bo.qty, fo.qty - bo.qty,
          fo.prix, bo.prix, fo.prix - bo.prix,
          fo.montant, bo.montant, fo.montant - bo.montant,
          fo.sens, bo.sens,
          discrepancies.join("; ")
        ]);
      }
    } else {
      // Transaction manquante dans FO
      rowResult.push([
        bo.tradeID, bo.dateTransaction, bo.isin,
        "Manquant", bo.qty, "Manquant",
        "Manquant", bo.prix, "Manquant",
        "Manquant", bo.montant, "Manquant",
        "Manquant", bo.sens,
        "Transaction manquante en FO"
      ]);
    }
  }

  // Parcourir les transactions du FO pour trouver celles manquantes en BO
  for (const key in foData) {
    if (!boData[key]) {
      const fo = foData[key];
      rowResult.push([
        fo.tradeID, fo.dateTransaction, fo.isin,
        fo.qty, "Manquant", "Manquant",
        fo.prix, "Manquant", "Manquant",
        fo.montant, "Manquant", "Manquant",
        fo.sens, "Manquant",
        "Transaction manquante en BO"
      ]);
    }
  }

  // Écrire les résultats dans la feuille "Écarts"
  if (rowResult.length > 0) {
    wsResult.getRange(2, 1, rowResult.length, 15).setValues(rowResult);
  }

  // Confirmation visuelle (notification discrète, sans bloquer l'utilisateur)
  SpreadsheetApp.getActiveSpreadsheet().toast(`Réconciliation terminée ! ${rowResult.length} écarts trouvés.`, "Succès", 5);
}
