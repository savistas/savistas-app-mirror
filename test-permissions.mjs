#!/usr/bin/env node

// Script pour tester directement la suppression des données troubles via l'API Supabase
// Ce script utilise les mêmes credentials que l'application

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://vvmkbpkoccxpmfpxhacv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2bWticGtvY2N4cG1mcHhoYWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzY2MTEsImV4cCI6MjA3MDM1MjYxMX0.I6XUsURaSpVwsZY-DrFw6tAUY50nzFkDBM4FqoPJpm4";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPermissions() {
  console.log('🔐 Test des permissions RLS...');
  
  try {
    // Test 1: Vérifier si on peut lire les tables sans authentification
    console.log('\n1. Test lecture sans auth...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, troubles_detection_completed')
      .limit(1);
    
    console.log('Profiles:', profiles?.length || 0, 'résultats', profilesError?.message || 'pas d\'erreur');
    
    const { data: questions, error: questionsError } = await supabase
      .from('troubles_questionnaire_reponses')
      .select('user_id')
      .limit(1);
    
    console.log('Questions:', questions?.length || 0, 'résultats', questionsError?.message || 'pas d\'erreur');
    
    const { data: scores, error: scoresError } = await supabase
      .from('troubles_detection_scores')
      .select('user_id')
      .limit(1);
    
    console.log('Scores:', scores?.length || 0, 'résultats', scoresError?.message || 'pas d\'erreur');
    
    // Test 2: Vérifier l'utilisateur actuel
    console.log('\n2. Test utilisateur actuel...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('❌ Pas d\'utilisateur connecté:', userError.message);
      console.log('💡 Il faut être connecté pour supprimer les données (RLS)');
      return;
    }
    
    console.log('✅ Utilisateur connecté:', user.id);
    
    // Test 3: Tester la suppression avec l'utilisateur connecté
    console.log('\n3. Test suppression avec utilisateur connecté...');
    
    // Vérifier les données avant
    const { data: beforeQuestions } = await supabase
      .from('troubles_questionnaire_reponses')
      .select('*')
      .eq('user_id', user.id);
    
    const { data: beforeScores } = await supabase
      .from('troubles_detection_scores')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('Avant suppression:');
    console.log('- Questions:', beforeQuestions?.length || 0);
    console.log('- Scores:', beforeScores?.length || 0);
    
    if ((beforeQuestions?.length || 0) === 0 && (beforeScores?.length || 0) === 0) {
      console.log('💡 Aucune donnée à supprimer pour cet utilisateur');
      return;
    }
    
    // Tentative de suppression
    console.log('\n4. Tentative de suppression...');
    
    const { error: deleteQuestionsError } = await supabase
      .from('troubles_questionnaire_reponses')
      .delete()
      .eq('user_id', user.id);
    
    console.log('Suppression questions:', deleteQuestionsError ? `❌ ${deleteQuestionsError.message}` : '✅ Succès');
    
    const { error: deleteScoresError } = await supabase
      .from('troubles_detection_scores')
      .delete()
      .eq('user_id', user.id);
    
    console.log('Suppression scores:', deleteScoresError ? `❌ ${deleteScoresError.message}` : '✅ Succès');
    
    // Vérifier après suppression
    const { data: afterQuestions } = await supabase
      .from('troubles_questionnaire_reponses')
      .select('*')
      .eq('user_id', user.id);
    
    const { data: afterScores } = await supabase
      .from('troubles_detection_scores')
      .select('*')
      .eq('user_id', user.id);
    
    console.log('\nAprès suppression:');
    console.log('- Questions:', afterQuestions?.length || 0);
    console.log('- Scores:', afterScores?.length || 0);
    
    if ((afterQuestions?.length || 0) === 0 && (afterScores?.length || 0) === 0) {
      console.log('🎉 Suppression réussie !');
    } else {
      console.log('❌ Suppression incomplète');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testPermissions();