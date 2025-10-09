// Script de debug pour tester la suppression des données troubles
// Exécutez ce script dans la console du navigateur

// Fonction pour vérifier les données actuelles d'un utilisateur
async function debugTroublesData(userId) {
  console.log('🔍 DEBUG: Vérification des données troubles pour user:', userId);
  
  if (!window.supabase) {
    console.error('❌ Supabase client non disponible');
    return;
  }

  try {
    // 1. Vérifier le profil
    const { data: profileData, error: profileError } = await window.supabase
      .from('profiles')
      .select('troubles_detection_completed, user_id')
      .eq('user_id', userId);
    
    console.log('📋 Profile data:', profileData, profileError);

    // 2. Vérifier les réponses du questionnaire
    const { data: questionsData, error: questionsError } = await window.supabase
      .from('troubles_questionnaire_reponses')
      .select('*')
      .eq('user_id', userId);
    
    console.log('❓ Questions data:', questionsData, questionsError);

    // 3. Vérifier les scores
    const { data: scoresData, error: scoresError } = await window.supabase
      .from('troubles_detection_scores')
      .select('*')
      .eq('user_id', userId);
    
    console.log('📊 Scores data:', scoresData, scoresError);

    return {
      profile: { data: profileData, error: profileError },
      questions: { data: questionsData, error: questionsError },
      scores: { data: scoresData, error: scoresError }
    };
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Fonction pour tester la suppression manuelle
async function testDeleteTroublesData(userId) {
  console.log('🗑️ TEST: Suppression manuelle des données troubles pour user:', userId);
  
  if (!window.supabase) {
    console.error('❌ Supabase client non disponible');
    return;
  }

  try {
    console.log('1. Données avant suppression:');
    await debugTroublesData(userId);

    console.log('2. Tentative de suppression...');

    // Supprimer les réponses du questionnaire
    const { error: questionsDeleteError } = await window.supabase
      .from('troubles_questionnaire_reponses')
      .delete()
      .eq('user_id', userId);
    
    console.log('Suppression questions:', questionsDeleteError ? '❌ Erreur' : '✅ Succès', questionsDeleteError);

    // Supprimer les scores
    const { error: scoresDeleteError } = await window.supabase
      .from('troubles_detection_scores')
      .delete()
      .eq('user_id', userId);
    
    console.log('Suppression scores:', scoresDeleteError ? '❌ Erreur' : '✅ Succès', scoresDeleteError);

    // Mettre à jour le profil
    const { error: profileUpdateError } = await window.supabase
      .from('profiles')
      .update({ troubles_detection_completed: false })
      .eq('user_id', userId);
    
    console.log('Mise à jour profil:', profileUpdateError ? '❌ Erreur' : '✅ Succès', profileUpdateError);

    console.log('3. Données après suppression:');
    await debugTroublesData(userId);

  } catch (error) {
    console.error('❌ Erreur lors du test de suppression:', error);
  }
}

// Fonction pour obtenir l'utilisateur actuel
async function getCurrentUser() {
  if (!window.supabase) {
    console.error('❌ Supabase client non disponible');
    return null;
  }

  try {
    const { data: { user }, error } = await window.supabase.auth.getUser();
    if (error) {
      console.error('❌ Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
    console.log('👤 Utilisateur actuel:', user?.id);
    return user;
  } catch (error) {
    console.error('❌ Erreur:', error);
    return null;
  }
}

// Fonction de test automatique pour l'utilisateur connecté
async function autoTestCurrentUser() {
  console.log('🚀 Test automatique pour l\'utilisateur connecté');
  const user = await getCurrentUser();
  if (user) {
    await debugTroublesData(user.id);
  }
}

// Fonction de suppression automatique pour l'utilisateur connecté
async function autoDeleteCurrentUser() {
  console.log('🗑️ Suppression automatique pour l\'utilisateur connecté');
  const user = await getCurrentUser();
  if (user) {
    await testDeleteTroublesData(user.id);
  }
}

// Vérification de la disponibilité de Supabase
if (typeof window !== 'undefined') {
  window.debugTroublesData = debugTroublesData;
  window.testDeleteTroublesData = testDeleteTroublesData;
  window.getCurrentUser = getCurrentUser;
  window.autoTestCurrentUser = autoTestCurrentUser;
  window.autoDeleteCurrentUser = autoDeleteCurrentUser;
  
  console.log(`
📋 FONCTIONS DE DEBUG DISPONIBLES:
- debugTroublesData(userId) : Vérifier les données d'un utilisateur
- testDeleteTroublesData(userId) : Tester la suppression pour un utilisateur
- getCurrentUser() : Obtenir l'utilisateur connecté
- autoTestCurrentUser() : Test automatique pour l'utilisateur connecté
- autoDeleteCurrentUser() : Suppression automatique pour l'utilisateur connecté

🎯 UTILISATION RAPIDE:
1. autoTestCurrentUser() - pour voir les données actuelles
2. autoDeleteCurrentUser() - pour tester la suppression
  `);
}