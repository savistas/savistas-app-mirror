// Script de test pour vérifier le fonctionnement du module de troubles
import { supabase } from './src/integrations/supabase/client';

// Test d'insertion de données de test
async function testTroublesDetection() {
  console.log('🧪 Test du module de prédétection de troubles...');
  
  // Test de connexion
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('❌ Utilisateur non connecté');
    return;
  }
  
  console.log('✅ Utilisateur connecté:', user.email);
  
  // Test d'insertion dans troubles_questionnaire_reponses
  const testAnswers = {
    user_id: user.id,
    has_medical_diagnosis: false,
    q1_attention: 'B',
    q2_lecture: 'A',
    q3_communication: 'A',
    q4_motricite_fine: 'B',
    q5_motricite_globale: 'A',
    q6_interaction_sociale: 'A',
    q7_sensibilite_sensorielle: 'B',
    q8_regulation_emotionnelle: 'B',
    q9_memoire: 'B',
    q10_calcul: 'A',
    q11_tics: 'A',
    q12_fluidite_parole: 'A',
    q13_sensibilites_isolees: 'A',
  };
  
  try {
    // Supprimer les données existantes pour le test
    await supabase
      .from('troubles_questionnaire_reponses')
      .delete()
      .eq('user_id', user.id);
      
    await supabase
      .from('troubles_detection_scores')
      .delete()
      .eq('user_id', user.id);
    
    // Insérer les réponses
    const { data: answersData, error: answersError } = await supabase
      .from('troubles_questionnaire_reponses')
      .insert(testAnswers)
      .select()
      .single();
    
    if (answersError) {
      console.log('❌ Erreur insertion réponses:', answersError);
      return;
    }
    
    console.log('✅ Réponses insérées:', answersData);
    
    // Test d'insertion des scores
    const testScores = {
      user_id: user.id,
      has_medical_diagnosis: false,
      tdah_score: 'Modéré',
      dyslexie_score: 'Faible',
      dyscalculie_score: 'Faible',
      dyspraxie_score: 'Modéré',
      tsa_score: 'Faible',
      trouble_langage_score: 'Faible',
      tdi_score: 'Faible',
      tics_tourette_score: 'Faible',
      begaiement_score: 'Faible',
      trouble_sensoriel_isole_score: 'Modéré',
    };
    
    const { data: scoresData, error: scoresError } = await supabase
      .from('troubles_detection_scores')
      .insert(testScores)
      .select()
      .single();
    
    if (scoresError) {
      console.log('❌ Erreur insertion scores:', scoresError);
      return;
    }
    
    console.log('✅ Scores insérés:', scoresData);
    
    // Test de mise à jour du profil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        troubles_detection_completed: true,
        learning_styles_completed: false 
      })
      .eq('user_id', user.id);
    
    if (profileError) {
      console.log('❌ Erreur mise à jour profil:', profileError);
      return;
    }
    
    console.log('✅ Profil mis à jour');
    
    // Test de lecture des données
    const { data: retrievedScores, error: readError } = await supabase
      .from('troubles_detection_scores')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (readError) {
      console.log('❌ Erreur lecture scores:', readError);
      return;
    }
    
    console.log('✅ Données récupérées:', retrievedScores);
    
    console.log('🎉 Test du module de troubles réussi !');
    
  } catch (error) {
    console.log('❌ Erreur générale:', error);
  }
}

// Exporter pour utilisation
export { testTroublesDetection };

// Si exécuté directement
if (typeof window !== 'undefined') {
  console.log('Module de test des troubles chargé. Utilisez testTroublesDetection() pour tester.');
}