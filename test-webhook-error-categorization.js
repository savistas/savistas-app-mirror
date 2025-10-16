/**
 * Script de test pour le webhook N8N de catégorisation des erreurs
 * Usage: node test-webhook-error-categorization.js
 */

const WEBHOOK_URL = "https://n8n.srv932562.hstgr.cloud/webhook/error-categorization";

// Exemple de payload avec plusieurs erreurs
const testPayload = {
  user_id: "test-user-12345",
  exercise_id: "test-exercise-67890",
  course_id: "test-course-abcde",
  timestamp: new Date().toISOString(),
  errors: [
    {
      matiere: "E-commerce",
      question: "Quelle est la première étape de la méthode 'Enfin Libre' pour devenir libre financièrement ?",
      reponse_fausse: "A. Trouver des produits gagnants sans parler aux fournisseurs.",
      bonne_reponse: "C. Ouvrir sa boutique e-commerce sans stock, ni inventaire, ni manipulation des produits.",
      explication: "La première étape de la méthode 'Enfin Libre' est d'ouvrir votre boutique e-commerce sans stock, sans inventaire et sans toucher les produits, ce qui correspond au concept du dropshipping.",
      question_index: "1"
    },
    {
      matiere: "E-commerce",
      question: "Quel est l'un des avantages majeurs du dropshipping par rapport à l'e-commerce classique ?",
      reponse_fausse: "A. Un risque financier élevé en raison des invendus possibles.",
      bonne_reponse: "C. Un capital de départ réduit et une flexibilité géographique très élevée.",
      explication: "Le dropshipping se distingue par un capital de départ réduit, l'absence de gestion de stock et une très grande flexibilité géographique, permettant de vendre des produits sans les avoir en main.",
      question_index: "3"
    },
    {
      matiere: "E-commerce",
      question: "Dans l'exemple du jouet pour bébé vendu à 24,90 € et acheté 2,90 € au fournisseur, quel est le bénéfice ?",
      reponse_fausse: "D. Pas de bénéfice car le vendeur n'a pas touché le produit.",
      bonne_reponse: "C. 22,00 €",
      explication: "Le bénéfice est calculé en soustrayant le prix d'achat chez le fournisseur (2,90 €) du prix de vente au client (24,90 €), soit 24,90 € - 2,90 € = 22,00 €.",
      question_index: "5"
    }
  ]
};

async function testWebhook() {
  console.log("🚀 Test du webhook N8N - Catégorisation des erreurs");
  console.log("📍 URL:", WEBHOOK_URL);
  console.log("\n📦 Payload envoyé:");
  console.log(JSON.stringify(testPayload, null, 2));
  console.log("\n⏳ Envoi en cours...\n");

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(testPayload)
    });

    console.log("✅ Statut de la réponse:", response.status, response.statusText);

    if (response.ok) {
      const responseData = await response.text();
      console.log("\n📥 Réponse du webhook:");

      try {
        const jsonResponse = JSON.parse(responseData);
        console.log(JSON.stringify(jsonResponse, null, 2));
      } catch {
        console.log(responseData);
      }

      console.log("\n✅ Test réussi ! Le webhook a bien reçu les données.");
    } else {
      console.log("\n❌ Erreur HTTP:", response.status);
      const errorText = await response.text();
      console.log("Détails:", errorText);
    }

  } catch (error) {
    console.error("\n❌ Erreur lors de l'envoi au webhook:");
    console.error(error.message);

    if (error.cause) {
      console.error("Cause:", error.cause);
    }
  }
}

// Exécuter le test
testWebhook();
