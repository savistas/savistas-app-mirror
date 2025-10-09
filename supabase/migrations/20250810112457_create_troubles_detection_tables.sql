-- Table 1: Réponses brutes du questionnaire
CREATE TABLE troubles_questionnaire_reponses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Diagnostic médical déclaré
  has_medical_diagnosis BOOLEAN DEFAULT false,
  medical_diagnosis_details TEXT, -- Si oui, détails du diagnostic + spécialiste
  
  -- Réponses aux 13 questions (A, B ou C)
  q1_attention TEXT CHECK (q1_attention IN ('A', 'B', 'C')),
  q2_lecture TEXT CHECK (q2_lecture IN ('A', 'B', 'C')),
  q3_communication TEXT CHECK (q3_communication IN ('A', 'B', 'C')),
  q4_motricite_fine TEXT CHECK (q4_motricite_fine IN ('A', 'B', 'C')),
  q5_motricite_globale TEXT CHECK (q5_motricite_globale IN ('A', 'B', 'C')),
  q6_interaction_sociale TEXT CHECK (q6_interaction_sociale IN ('A', 'B', 'C')),
  q7_sensibilite_sensorielle TEXT CHECK (q7_sensibilite_sensorielle IN ('A', 'B', 'C')),
  q8_regulation_emotionnelle TEXT CHECK (q8_regulation_emotionnelle IN ('A', 'B', 'C')),
  q9_memoire TEXT CHECK (q9_memoire IN ('A', 'B', 'C')),
  q10_calcul TEXT CHECK (q10_calcul IN ('A', 'B', 'C')),
  q11_tics TEXT CHECK (q11_tics IN ('A', 'B', 'C')),
  q12_fluidite_parole TEXT CHECK (q12_fluidite_parole IN ('A', 'B', 'C')),
  q13_sensibilites_isolees TEXT CHECK (q13_sensibilites_isolees IN ('A', 'B', 'C')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: Scores calculés pour chaque trouble
CREATE TABLE troubles_detection_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Scores pour chaque trouble (Faible, Modéré, Élevé, Très élevé)
  tdah_score TEXT CHECK (tdah_score IN ('Faible', 'Modéré', 'Élevé', 'Très élevé')),
  dyslexie_score TEXT CHECK (dyslexie_score IN ('Faible', 'Modéré', 'Élevé', 'Très élevé')),
  dyscalculie_score TEXT CHECK (dyscalculie_score IN ('Faible', 'Modéré', 'Élevé', 'Très élevé')),
  dyspraxie_score TEXT CHECK (dyspraxie_score IN ('Faible', 'Modéré', 'Élevé', 'Très élevé')),
  tsa_score TEXT CHECK (tsa_score IN ('Faible', 'Modéré', 'Élevé', 'Très élevé')),
  trouble_langage_score TEXT CHECK (trouble_langage_score IN ('Faible', 'Modéré', 'Élevé', 'Très élevé')),
  tdi_score TEXT CHECK (tdi_score IN ('Faible', 'Modéré', 'Élevé', 'Très élevé')),
  tics_tourette_score TEXT CHECK (tics_tourette_score IN ('Faible', 'Modéré', 'Élevé', 'Très élevé')),
  begaiement_score TEXT CHECK (begaiement_score IN ('Faible', 'Modéré', 'Élevé', 'Très élevé')),
  trouble_sensoriel_isole_score TEXT CHECK (trouble_sensoriel_isole_score IN ('Faible', 'Modéré', 'Élevé', 'Très élevé')),
  
  -- Diagnostic médical (copié depuis troubles_questionnaire_reponses si applicable)
  has_medical_diagnosis BOOLEAN DEFAULT false,
  medical_diagnosis_details TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter un champ dans profiles pour tracker si les questionnaires sont complétés
ALTER TABLE profiles 
ADD COLUMN troubles_detection_completed BOOLEAN DEFAULT false,
ADD COLUMN learning_styles_completed BOOLEAN DEFAULT false;

-- RLS policies pour troubles_questionnaire_reponses
ALTER TABLE troubles_questionnaire_reponses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own questionnaire responses" ON troubles_questionnaire_reponses
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own questionnaire responses" ON troubles_questionnaire_reponses
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own questionnaire responses" ON troubles_questionnaire_reponses
FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies pour troubles_detection_scores
ALTER TABLE troubles_detection_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own detection scores" ON troubles_detection_scores
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own detection scores" ON troubles_detection_scores
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own detection scores" ON troubles_detection_scores
FOR UPDATE USING (auth.uid() = user_id);