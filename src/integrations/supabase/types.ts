export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          course_content: string | null
          cover_url: string | null
          created_at: string
          days_number: string | null
          description: string | null
          fiche_revision_status: string | null
          fiche_revision_url: string | null
          file_url: string | null
          id: string
          professor_role: string | null
          subject: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_content?: string | null
          cover_url?: string | null
          created_at?: string
          days_number?: string | null
          description?: string | null
          fiche_revision_status?: string | null
          fiche_revision_url?: string | null
          file_url?: string | null
          id?: string
          professor_role?: string | null
          subject?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_content?: string | null
          cover_url?: string | null
          created_at?: string
          days_number?: string | null
          description?: string | null
          fiche_revision_status?: string | null
          fiche_revision_url?: string | null
          file_url?: string | null
          id?: string
          professor_role?: string | null
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      emails_registry: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_registry_email_fkey"
            columns: ["email"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["email"]
          },
          {
            foreignKeyName: "emails_registry_email_fkey"
            columns: ["email"]
            isOneToOne: true
            referencedRelation: "profiles_emails"
            referencedColumns: ["email"]
          },
        ]
      }
      error_responses: {
        Row: {
          categorie: string
          course_id: string
          created_at: string | null
          exercice_id: string
          id: string
          justification: string | null
          matiere: string
          message: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categorie: string
          course_id: string
          created_at?: string | null
          exercice_id: string
          id?: string
          justification?: string | null
          matiere: string
          message: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categorie?: string
          course_id?: string
          created_at?: string | null
          exercice_id?: string
          id?: string
          justification?: string | null
          matiere?: string
          message?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "error_responses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_responses: {
        Row: {
          course_id: string
          created_at: string
          exercise_id: string
          id: string
          metadata: Json | null
          total_time_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          exercise_id: string
          id?: string
          metadata?: Json | null
          total_time_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          exercise_id?: string
          id?: string
          metadata?: Json | null
          total_time_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_responses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_responses_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          course_id: string
          created_at: string
          date_exercice: string | null
          exercice_title: string | null
          id: string
          metadata: Json | null
          order_index: number | null
          statut: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          date_exercice?: string | null
          exercice_title?: string | null
          id?: string
          metadata?: Json | null
          order_index?: number | null
          statut?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          date_exercice?: string | null
          exercice_title?: string | null
          id?: string
          metadata?: Json | null
          order_index?: number | null
          statut?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      fiche_revision: {
        Row: {
          course_id: string
          created_at: string
          file_name: string | null
          file_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiche_revision_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_level: string | null
          city: string | null
          classes: string | null
          country: string | null
          created_at: string
          education_level: string | null
          email: string | null
          ent: string | null
          full_name: string | null
          id: string
          learning_styles_completed: boolean | null
          link_code: string | null
          link_relation: string | null
          phone: string | null
          postal_code: string | null
          profile_photo_url: string | null
          role: string | null
          subjects: string | null
          subscription: string | null
          survey_completed: boolean | null
          troubles_detection_completed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_level?: string | null
          city?: string | null
          classes?: string | null
          country?: string | null
          created_at?: string
          education_level?: string | null
          email?: string | null
          ent?: string | null
          full_name?: string | null
          id?: string
          learning_styles_completed?: boolean | null
          link_code?: string | null
          link_relation?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_photo_url?: string | null
          role?: string | null
          subjects?: string | null
          subscription?: string | null
          survey_completed?: boolean | null
          troubles_detection_completed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_level?: string | null
          city?: string | null
          classes?: string | null
          country?: string | null
          created_at?: string
          education_level?: string | null
          email?: string | null
          ent?: string | null
          full_name?: string | null
          id?: string
          learning_styles_completed?: boolean | null
          link_code?: string | null
          link_relation?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_photo_url?: string | null
          role?: string | null
          subjects?: string | null
          subscription?: string | null
          survey_completed?: boolean | null
          troubles_detection_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles_infos: {
        Row: {
          created_at: string | null
          decouvrir_endroit: string | null
          id: string
          memoire_poesie: string | null
          pref_apprendre_idee: string | null
          pref_enseignant: string | null
          resoudre_maths: string | null
          retenir_info: string | null
          reussir_definition: string | null
          souvenir_important: string | null
          temps_libre_pref: string | null
          travail_groupe_role: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          decouvrir_endroit?: string | null
          id?: string
          memoire_poesie?: string | null
          pref_apprendre_idee?: string | null
          pref_enseignant?: string | null
          resoudre_maths?: string | null
          retenir_info?: string | null
          reussir_definition?: string | null
          souvenir_important?: string | null
          temps_libre_pref?: string | null
          travail_groupe_role?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          decouvrir_endroit?: string | null
          id?: string
          memoire_poesie?: string | null
          pref_apprendre_idee?: string | null
          pref_enseignant?: string | null
          resoudre_maths?: string | null
          retenir_info?: string | null
          reussir_definition?: string | null
          souvenir_important?: string | null
          temps_libre_pref?: string | null
          travail_groupe_role?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      question_timings: {
        Row: {
          created_at: string | null
          exercise_response_id: string
          id: string
          question_index: string
          time_spent_seconds: number
        }
        Insert: {
          created_at?: string | null
          exercise_response_id: string
          id?: string
          question_index: string
          time_spent_seconds?: number
        }
        Update: {
          created_at?: string | null
          exercise_response_id?: string
          id?: string
          question_index?: string
          time_spent_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "question_timings_exercise_response_id_fkey"
            columns: ["exercise_response_id"]
            isOneToOne: false
            referencedRelation: "exercise_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      styles_apprentissage: {
        Row: {
          created_at: string | null
          score_auditif: number | null
          score_ecriture: number | null
          score_interpersonnelle: number | null
          score_intrapersonnelle: number | null
          score_kinesthesique: number | null
          score_lecture: number | null
          score_linguistique: number | null
          score_logique_mathematique: number | null
          score_musicale: number | null
          score_naturaliste: number | null
          score_spatial: number | null
          score_visuel: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          score_auditif?: number | null
          score_ecriture?: number | null
          score_interpersonnelle?: number | null
          score_intrapersonnelle?: number | null
          score_kinesthesique?: number | null
          score_lecture?: number | null
          score_linguistique?: number | null
          score_logique_mathematique?: number | null
          score_musicale?: number | null
          score_naturaliste?: number | null
          score_spatial?: number | null
          score_visuel?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          score_auditif?: number | null
          score_ecriture?: number | null
          score_interpersonnelle?: number | null
          score_intrapersonnelle?: number | null
          score_kinesthesique?: number | null
          score_lecture?: number | null
          score_linguistique?: number | null
          score_logique_mathematique?: number | null
          score_musicale?: number | null
          score_naturaliste?: number | null
          score_spatial?: number | null
          score_visuel?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      troubles_detection_scores: {
        Row: {
          begaiement_score: string | null
          created_at: string | null
          dyscalculie_score: string | null
          dyslexie_score: string | null
          dyspraxie_score: string | null
          has_medical_diagnosis: boolean | null
          id: string
          medical_diagnosis_details: string | null
          tdah_score: string | null
          tdi_score: string | null
          tics_tourette_score: string | null
          trouble_langage_score: string | null
          trouble_sensoriel_isole_score: string | null
          tsa_score: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          begaiement_score?: string | null
          created_at?: string | null
          dyscalculie_score?: string | null
          dyslexie_score?: string | null
          dyspraxie_score?: string | null
          has_medical_diagnosis?: boolean | null
          id?: string
          medical_diagnosis_details?: string | null
          tdah_score?: string | null
          tdi_score?: string | null
          tics_tourette_score?: string | null
          trouble_langage_score?: string | null
          trouble_sensoriel_isole_score?: string | null
          tsa_score?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          begaiement_score?: string | null
          created_at?: string | null
          dyscalculie_score?: string | null
          dyslexie_score?: string | null
          dyspraxie_score?: string | null
          has_medical_diagnosis?: boolean | null
          id?: string
          medical_diagnosis_details?: string | null
          tdah_score?: string | null
          tdi_score?: string | null
          tics_tourette_score?: string | null
          trouble_langage_score?: string | null
          trouble_sensoriel_isole_score?: string | null
          tsa_score?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      troubles_questionnaire_reponses: {
        Row: {
          created_at: string | null
          has_medical_diagnosis: boolean | null
          id: string
          medical_diagnosis_details: string | null
          q1_attention: string | null
          q10_calcul: string | null
          q11_tics: string | null
          q12_fluidite_parole: string | null
          q13_sensibilites_isolees: string | null
          q2_lecture: string | null
          q3_communication: string | null
          q4_motricite_fine: string | null
          q5_motricite_globale: string | null
          q6_interaction_sociale: string | null
          q7_sensibilite_sensorielle: string | null
          q8_regulation_emotionnelle: string | null
          q9_memoire: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          has_medical_diagnosis?: boolean | null
          id?: string
          medical_diagnosis_details?: string | null
          q1_attention?: string | null
          q10_calcul?: string | null
          q11_tics?: string | null
          q12_fluidite_parole?: string | null
          q13_sensibilites_isolees?: string | null
          q2_lecture?: string | null
          q3_communication?: string | null
          q4_motricite_fine?: string | null
          q5_motricite_globale?: string | null
          q6_interaction_sociale?: string | null
          q7_sensibilite_sensorielle?: string | null
          q8_regulation_emotionnelle?: string | null
          q9_memoire?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          has_medical_diagnosis?: boolean | null
          id?: string
          medical_diagnosis_details?: string | null
          q1_attention?: string | null
          q10_calcul?: string | null
          q11_tics?: string | null
          q12_fluidite_parole?: string | null
          q13_sensibilites_isolees?: string | null
          q2_lecture?: string | null
          q3_communication?: string | null
          q4_motricite_fine?: string | null
          q5_motricite_globale?: string | null
          q6_interaction_sociale?: string | null
          q7_sensibilite_sensorielle?: string | null
          q8_regulation_emotionnelle?: string | null
          q9_memoire?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_emails: {
        Row: {
          email: string | null
        }
        Insert: {
          email?: string | null
        }
        Update: {
          email?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      sync_all_emails: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
