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
      exercise_responses: {
        Row: {
          course_id: string
          created_at: string
          exercise_id: string
          id: string
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          exercise_id: string
          id?: string
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          exercise_id?: string
          id?: string
          metadata?: Json | null
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
          link_code: string | null
          link_relation: string | null
          phone: string | null
          postal_code: string | null
          profile_photo_url: string | null
          role: string | null
          subjects: string | null
          subscription: string | null
          survey_completed: boolean | null
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
          link_code?: string | null
          link_relation?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_photo_url?: string | null
          role?: string | null
          subjects?: string | null
          subscription?: string | null
          survey_completed?: boolean | null
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
          link_code?: string | null
          link_relation?: string | null
          phone?: string | null
          postal_code?: string | null
          profile_photo_url?: string | null
          role?: string | null
          subjects?: string | null
          subscription?: string | null
          survey_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles_infos: {
        Row: {
          age: string | null
          aime_apprendre: string | null
          comprehension_texte: string | null
          created_at: string | null
          decouragement_travail: string | null
          difficulte_commencer: string | null
          difficulte_concentration: string | null
          distraction_etudes: string | null
          erreurs_inattention: string | null
          etude_frequence: string | null
          finir_travaux_delais: string | null
          heures_travail_ecole: string | null
          id: string
          matieres_difficulte: string | null
          matieres_reussite: string | null
          niveau_etudes: string | null
          objectifs_etudes: string | null
          outils_apprentissage: string | null
          plan_aide_scolaire: string | null
          planifier_reponse: string | null
          planning_etudes: string | null
          pref_apprendre: string[] | null
          prend_notes: string | null
          recompense_objectif: string | null
          reformuler_texte: string | null
          reperer_mots_cles: string | null
          stress_examen: string | null
          travail_seul_groupe: string | null
          trouble_diagnostique: string[] | null
          user_id: string | null
          utilise_resumes: string | null
        }
        Insert: {
          age?: string | null
          aime_apprendre?: string | null
          comprehension_texte?: string | null
          created_at?: string | null
          decouragement_travail?: string | null
          difficulte_commencer?: string | null
          difficulte_concentration?: string | null
          distraction_etudes?: string | null
          erreurs_inattention?: string | null
          etude_frequence?: string | null
          finir_travaux_delais?: string | null
          heures_travail_ecole?: string | null
          id?: string
          matieres_difficulte?: string | null
          matieres_reussite?: string | null
          niveau_etudes?: string | null
          objectifs_etudes?: string | null
          outils_apprentissage?: string | null
          plan_aide_scolaire?: string | null
          planifier_reponse?: string | null
          planning_etudes?: string | null
          pref_apprendre?: string[] | null
          prend_notes?: string | null
          recompense_objectif?: string | null
          reformuler_texte?: string | null
          reperer_mots_cles?: string | null
          stress_examen?: string | null
          travail_seul_groupe?: string | null
          trouble_diagnostique?: string[] | null
          user_id?: string | null
          utilise_resumes?: string | null
        }
        Update: {
          age?: string | null
          aime_apprendre?: string | null
          comprehension_texte?: string | null
          created_at?: string | null
          decouragement_travail?: string | null
          difficulte_commencer?: string | null
          difficulte_concentration?: string | null
          distraction_etudes?: string | null
          erreurs_inattention?: string | null
          etude_frequence?: string | null
          finir_travaux_delais?: string | null
          heures_travail_ecole?: string | null
          id?: string
          matieres_difficulte?: string | null
          matieres_reussite?: string | null
          niveau_etudes?: string | null
          objectifs_etudes?: string | null
          outils_apprentissage?: string | null
          plan_aide_scolaire?: string | null
          planifier_reponse?: string | null
          planning_etudes?: string | null
          pref_apprendre?: string[] | null
          prend_notes?: string | null
          recompense_objectif?: string | null
          reformuler_texte?: string | null
          reperer_mots_cles?: string | null
          stress_examen?: string | null
          travail_seul_groupe?: string | null
          trouble_diagnostique?: string[] | null
          user_id?: string | null
          utilise_resumes?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
