export type TroubleScore = 'Faible' | 'Modéré' | 'Élevé' | 'Très élevé';
export type QuestionAnswer = 'A' | 'B' | 'C';

export interface TroublesQuestionnaireReponses {
  id: string;
  user_id: string;
  has_medical_diagnosis: boolean;
  medical_diagnosis_details?: string;
  q1_attention?: QuestionAnswer;
  q2_lecture?: QuestionAnswer;
  q3_communication?: QuestionAnswer;
  q4_motricite_fine?: QuestionAnswer;
  q5_motricite_globale?: QuestionAnswer;
  q6_interaction_sociale?: QuestionAnswer;
  q7_sensibilite_sensorielle?: QuestionAnswer;
  q8_regulation_emotionnelle?: QuestionAnswer;
  q9_memoire?: QuestionAnswer;
  q10_calcul?: QuestionAnswer;
  q11_tics?: QuestionAnswer;
  q12_fluidite_parole?: QuestionAnswer;
  q13_sensibilites_isolees?: QuestionAnswer;
  created_at: string;
  updated_at: string;
}

export interface TroublesDetectionScores {
  id: string;
  user_id: string;
  tdah_score?: TroubleScore;
  dyslexie_score?: TroubleScore;
  dyscalculie_score?: TroubleScore;
  dyspraxie_score?: TroubleScore;
  tsa_score?: TroubleScore;
  trouble_langage_score?: TroubleScore;
  tdi_score?: TroubleScore;
  tics_tourette_score?: TroubleScore;
  begaiement_score?: TroubleScore;
  trouble_sensoriel_isole_score?: TroubleScore;
  has_medical_diagnosis: boolean;
  medical_diagnosis_details?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileExtended {
  user_id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  postal_code?: string;
  education_level?: string;
  classes?: string;
  subjects?: string;
  profile_photo_url?: string;
  survey_completed: boolean;
  troubles_detection_completed: boolean;
  learning_styles_completed: boolean;
  created_at: string;
  updated_at: string;
}