-- Ajouter les politiques DELETE manquantes pour les tables troubles

-- Politique DELETE pour troubles_questionnaire_reponses
CREATE POLICY "Users can delete their own questionnaire responses" ON troubles_questionnaire_reponses
FOR DELETE USING (auth.uid() = user_id);

-- Politique DELETE pour troubles_detection_scores  
CREATE POLICY "Users can delete their own detection scores" ON troubles_detection_scores
FOR DELETE USING (auth.uid() = user_id);