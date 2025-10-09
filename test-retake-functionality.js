// Script de test pour la fonctionnalite "Refaire le test"
// Ce script permet de verifier que la suppression des donnees fonctionne correctement

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase (remplacez par vos vraies valeurs)
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseKey = 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRetakeFunctionality(userId) {
  console.log('Test de la fonctionnalite "Refaire le test"');
  console.log('================================================');
  
  try {
    // 1. Verifier l'etat initial
    console.log('1. Etat initial des donnees...');
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('troubles_detection_completed')
      .eq('user_id', userId)
      .single();
    
    const { data: questionsData } = await supabase
      .from('troubles_questionnaire_reponses')
      .select('*')
      .eq('user_id', userId);
    
    const { data: scoresData } = await supabase
      .from('troubles_detection_scores')
      .select('*')
      .eq('user_id', userId);
    
    console.log('Profile completed flag:', profileData?.troubles_detection_completed);
    console.log('Questionnaire responses:', questionsData?.length || 0, 'entrees');
    console.log('Detection scores:', scoresData?.length || 0, 'entrees');
    
    // 2. Simuler la suppression (comme dans handleConfirmRetakeTest)
    console.log('2. Simulation de la suppression...');
    
    // Remettre le flag a false
    await supabase
      .from('profiles')
      .update({ troubles_detection_completed: false })
      .eq('user_id', userId);
    
    // Supprimer les reponses du questionnaire
    await supabase
      .from('troubles_questionnaire_reponses')
      .delete()
      .eq('user_id', userId);
    
    // Supprimer les scores de detection
    await supabase
      .from('troubles_detection_scores')
      .delete()
      .eq('user_id', userId);
    
    console.log('Suppression effectuee');
    
    // 3. Verifier l'etat final
    console.log('3. Verification de l\'etat final...');
    
    const { data: profileDataAfter } = await supabase
      .from('profiles')
      .select('troubles_detection_completed')
      .eq('user_id', userId)
      .single();
    
    const { data: questionsDataAfter } = await supabase
      .from('troubles_questionnaire_reponses')
      .select('*')
      .eq('user_id', userId);
    
    const { data: scoresDataAfter } = await supabase
      .from('troubles_detection_scores')
      .select('*')
      .eq('user_id', userId);
    
    console.log('Profile completed flag après:', profileDataAfter?.troubles_detection_completed);
    console.log('Questionnaire responses après:', questionsDataAfter?.length || 0, 'entrées');
    console.log('Detection scores après:', scoresDataAfter?.length || 0, 'entrées');
    
    // 4. Validation
    console.log('\n4️⃣ Validation du test...');
    const isSuccess = 
      profileDataAfter?.troubles_detection_completed === false &&
      questionsDataAfter?.length === 0 &&
      scoresDataAfter?.length === 0;
    
    if (isSuccess) {
      console.log('🎉 TEST RÉUSSI : Toutes les données ont été correctement supprimées');
    } else {
      console.log('❌ TEST ÉCHOUÉ : Certaines données n\'ont pas été supprimées');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Fonctions utilitaires pour les tests manuels
async function checkUserData(userId) {
  console.log('🔍 Vérification des données utilisateur:', userId);
  
  const { data: profileData } = await supabase
    .from('profiles')
    .select('troubles_detection_completed')
    .eq('user_id', userId)
    .single();
  
  const { data: questionsData } = await supabase
    .from('troubles_questionnaire_reponses')
    .select('*')
    .eq('user_id', userId);
  
  const { data: scoresData } = await supabase
    .from('troubles_detection_scores')
    .select('*')
    .eq('user_id', userId);
  
  return {
    completed: profileData?.troubles_detection_completed,
    questionsCount: questionsData?.length || 0,
    scoresCount: scoresData?.length || 0,
    questionsData: questionsData,
    scoresData: scoresData
  };
}

async function resetUserTroublesData(userId) {
  console.log('🔄 Réinitialisation des données troubles pour:', userId);
  
  await supabase
    .from('profiles')
    .update({ troubles_detection_completed: false })
    .eq('user_id', userId);
  
  await supabase
    .from('troubles_questionnaire_reponses')
    .delete()
    .eq('user_id', userId);
  
  await supabase
    .from('troubles_detection_scores')
    .delete()
    .eq('user_id', userId);
  
  console.log('✅ Réinitialisation terminée');
}

// Export des fonctions pour utilisation dans la console du navigateur
if (typeof window !== 'undefined') {
  window.testRetakeFunctionality = testRetakeFunctionality;
  window.checkUserData = checkUserData;
  window.resetUserTroublesData = resetUserTroublesData;
}

console.log(`
📋 INSTRUCTIONS D'UTILISATION :
1. Ouvrez les outils de développement du navigateur (F12)
2. Allez dans l'onglet Console
3. Utilisez ces fonctions :
   - checkUserData('USER_ID') : Vérifier les données d'un utilisateur
   - resetUserTroublesData('USER_ID') : Réinitialiser les données
   - testRetakeFunctionality('USER_ID') : Tester la fonctionnalité complète

Remplacez 'USER_ID' par l'ID réel de l'utilisateur à tester.
`);