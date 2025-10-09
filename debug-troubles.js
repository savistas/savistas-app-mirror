// Script de debug pour vérifier les données de troubles
// À exécuter dans la console du navigateur

// 1. Vérifier l'état actuel de l'utilisateur
const checkUserTroubles = async () => {
  console.log('🔍 Debug - Vérification des données troubles...');
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ Aucun utilisateur connecté');
    return;
  }
  
  console.log('👤 Utilisateur:', user.email);
  
  // Check profile flags
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('troubles_detection_completed, learning_styles_completed, survey_completed')
    .eq('user_id', user.id)
    .single();
  
  console.log('📋 Profil flags:', profile);
  if (profileError) console.log('❌ Erreur profil:', profileError);
  
  // Check troubles questionnaire responses
  const { data: responses, error: responsesError } = await supabase
    .from('troubles_questionnaire_reponses')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  console.log('📝 Réponses questionnaire:', responses);
  if (responsesError) console.log('❌ Erreur réponses:', responsesError);
  
  // Check troubles detection scores
  const { data: scores, error: scoresError } = await supabase
    .from('troubles_detection_scores')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  console.log('📊 Scores détection:', scores);
  if (scoresError) console.log('❌ Erreur scores:', scoresError);
  
  // Analyse
  console.log('\n🔍 ANALYSE:');
  
  if (!responses && !scores) {
    console.log('❌ Aucune donnée trouvée - L\'utilisateur n\'a pas encore fait le test');
  } else if (responses && !scores) {
    console.log('⚠️ Réponses présentes mais pas de scores - Problème de sauvegarde des scores');
  } else if (!responses && scores) {
    console.log('⚠️ Scores présents mais pas de réponses - Problème de sauvegarde des réponses');
  } else {
    console.log('✅ Données complètes trouvées');
    
    if (scores.has_medical_diagnosis) {
      console.log('🏥 Diagnostic médical:', scores.medical_diagnosis_details);
      
      if (!scores.medical_diagnosis_details) {
        console.log('❌ PROBLÈME: has_medical_diagnosis=true mais medical_diagnosis_details vide');
      }
    } else {
      console.log('📋 Pas de diagnostic médical, vérification des scores QCM...');
      
      const activeScores = Object.entries(scores)
        .filter(([key, value]) => key.endsWith('_score') && value && value !== 'Faible')
        .map(([key, value]) => `${key}: ${value}`);
      
      if (activeScores.length > 0) {
        console.log('📈 Scores actifs:', activeScores);
      } else {
        console.log('📊 Tous les scores sont "Faible" ou vides');
      }
    }
  }
};

// 2. Fonction pour réinitialiser les données (si besoin)
const resetUserTroubles = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  console.log('🔄 Réinitialisation des données troubles...');
  
  await supabase.from('troubles_questionnaire_reponses').delete().eq('user_id', user.id);
  await supabase.from('troubles_detection_scores').delete().eq('user_id', user.id);
  await supabase.from('profiles').update({ 
    troubles_detection_completed: false 
  }).eq('user_id', user.id);
  
  console.log('✅ Données réinitialisées');
};

// 3. Fonction pour forcer un diagnostic de test
const createTestDiagnosis = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  console.log('🧪 Création d\'un diagnostic de test...');
  
  // Insert test response
  const responseData = {
    user_id: user.id,
    has_medical_diagnosis: true,
    medical_diagnosis_details: 'TDAH diagnostiqué par Dr. Martin en 2023 (TEST)'
  };
  
  const { data: response, error: responseError } = await supabase
    .from('troubles_questionnaire_reponses')
    .upsert(responseData)
    .select()
    .single();
  
  console.log('📝 Réponse test:', response);
  if (responseError) console.log('❌ Erreur réponse:', responseError);
  
  // Insert test scores
  const scoresData = {
    user_id: user.id,
    has_medical_diagnosis: true,
    medical_diagnosis_details: 'TDAH diagnostiqué par Dr. Martin en 2023 (TEST)'
  };
  
  const { data: scores, error: scoresError } = await supabase
    .from('troubles_detection_scores')
    .upsert(scoresData)
    .select()
    .single();
  
  console.log('📊 Scores test:', scores);
  if (scoresError) console.log('❌ Erreur scores:', scoresError);
  
  // Update profile
  await supabase.from('profiles').update({ 
    troubles_detection_completed: true 
  }).eq('user_id', user.id);
  
  console.log('✅ Diagnostic de test créé');
};

// Export functions for console use
window.debugTroubles = {
  check: checkUserTroubles,
  reset: resetUserTroubles,
  createTest: createTestDiagnosis
};

console.log('🛠️ Fonctions debug disponibles:');
console.log('- debugTroubles.check() - Vérifier les données');
console.log('- debugTroubles.reset() - Réinitialiser les données');
console.log('- debugTroubles.createTest() - Créer un diagnostic de test');