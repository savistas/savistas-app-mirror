export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase?: { // Added from remote, made optional
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      profiles_infos: { // From HEAD
        Row: {
          id: string
          user_id: string | null
          age: string | null
          niveau_etudes: string | null
          matieres_reussite: string | null
          matieres_difficulte: string | null
          pref_apprendre: string[] | null
          prend_notes: string | null
          utilise_resumes: string | null
          travail_seul_groupe: string | null
          etude_frequence: string | null
          outils_apprentissage: string | null
          comprehension_texte: string | null
          reperer_mots_cles: string | null
          reformuler_texte: string | null
          planifier_reponse: string | null
          erreurs_inattention: string | null
          planning_etudes: string | null
          heures_travail_ecole: string | null
          difficulte_commencer: string | null
          finir_travaux_delais: string | null
          difficulte_concentration: string | null
          distraction_etudes: string | null
          trouble_diagnostique: string[] | null
          plan_aide_scolaire: string | null
          aime_apprendre: string | null
          decouragement_travail: string | null
          stress_examen: string | null
          objectifs_etudes: string | null
          recompense_objectif: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          age?: string | null
          niveau_etudes?: string | null
          matieres_reussite?: string | null
          matieres_difficulte?: string | null
          pref_apprendre?: string[] | null
          prend_notes?: string | null
          utilise_resumes?: string | null
          travail_seul_groupe?: string | null
          etude_frequence?: string | null
          outils_apprentissage?: string | null
          comprehension_texte?: string | null
          reperer_mots_cles?: string | null
          reformuler_texte?: string | null
          planifier_reponse?: string | null
          erreurs_inattention?: string | null
          planning_etudes?: string | null
          heures_travail_ecole?: string | null
          difficulte_commencer?: string | null
          finir_travaux_delais?: string | null
          difficulte_concentration?: string | null
          distraction_etudes?: string | null
          trouble_diagnostique?: string[] | null
          plan_aide_scolaire?: string | null
          aime_apprendre?: string | null
          decouragement_travail?: string | null
          stress_examen?: string | null
          objectifs_etudes?: string | null
          recompense_objectif?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          age?: string | null
          niveau_etudes?: string | null
          matieres_reussite?: string | null
          matieres_difficulte?: string | null
          pref_apprendre?: string[] | null
          prend_notes?: string | null
          utilise_resumes?: string | null
          travail_seul_groupe?: string | null
          etude_frequence?: string | null
          outils_apprentissage?: string | null
          comprehension_texte?: string | null
          reperer_mots_cles?: string | null
          reformuler_texte?: string | null
          planifier_reponse?: string | null
          erreurs_inattention?: string | null
          planning_etudes?: string | null
          heures_travail_ecole?: string | null
          difficulte_commencer?: string | null
          finir_travaux_delais?: string | null
          difficulte_concentration?: string | null
          distraction_etudes?: string | null
          trouble_diagnostique?: string[] | null
          plan_aide_scolaire?: string | null
          aime_apprendre?: string | null
          decouragement_travail?: string | null
          stress_examen?: string | null
          objectifs_etudes?: string | null
          recompense_objectif?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_infos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: { // Merged from both
        Row: {
          id: string
          created_at: string
          full_name: string | null
          role: string | null
          subscription: string | null
          country: string | null
          city: string | null
          postal_code: string | null
          education_level: string | null
          classes: string | null
          subjects: string | null
          profile_photo_url: string | null
          link_code: string | null
          link_relation: string | null
          ent: string | null
          ai_level: string | null
          email: string | null
          phone: string | null
          user_id: string
          updated_at: string // Added from remote
        }
        Insert: {
          id?: string
          created_at?: string
          full_name?: string | null
          role?: string | null
          subscription?: string | null
          country?: string | null
          city?: string | null
          postal_code?: string | null
          education_level?: string | null
          classes?: string | null
          subjects?: string | null
          profile_photo_url?: string | null
          link_code?: string | null
          link_relation?: string | null
          ent?: string | null
          ai_level?: string | null
          email?: string | null
          phone?: string | null
          user_id: string
          updated_at?: string // Added from remote
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string | null
          role?: string | null
          subscription?: string | null
          country?: string | null
          city?: string | null
          postal_code?: string | null
          education_level?: string | null
          classes?: string | null
          subjects?: string | null
          profile_photo_url?: string | null
          link_code?: string | null
          link_relation?: string | null
          ent?: string | null
          ai_level?: string | null
          email?: string | null
          phone?: string | null
          user_id?: string
          updated_at?: string // Added from remote
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: { // From remote
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
      courses: { // Merged from both
        Row: {
          id: string
          created_at: string
          title: string
          subject: string
          level: string
          description: string | null
          file_url: Json // From HEAD
          cover_url: Json | null // From HEAD
          user_id: string
          updated_at: string // From remote
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          subject: string
          level: string
          description?: string | null
          file_url: Json // From HEAD
          cover_url?: Json | null // From HEAD
          user_id: string
          updated_at?: string // From remote
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          subject?: string
          level?: string
          description?: string | null
          file_url?: Json // From HEAD
          cover_url?: Json | null // From HEAD
          user_id?: string
          updated_at?: string // From remote
        }
        Relationships: [
          {
            foreignKeyName: "courses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_responses: { // Merged from both
        Row: {
          id: string;
          created_at: string;
          is_correct: boolean | null;
          score: number | null;
          course_id: string;
          user_id: string;
          answer: string | null; // From remote
          exercise_id: string; // From remote
          updated_at: string; // From remote
        };
        Insert: {
          id?: string;
          created_at?: string;
          is_correct?: boolean | null;
          score?: number | null;
          course_id: string;
          user_id: string;
          answer?: string | null; // From remote
          exercise_id: string; // From remote
          updated_at?: string; // From remote
        };
        Update: {
          id?: string;
          created_at?: string;
          is_correct?: boolean | null;
          score?: number | null;
          course_id?: string;
          user_id?: string;
          answer?: string | null; // From remote
          exercise_id?: string; // From remote
          updated_at?: string; // From remote
        };
        Relationships: [
          {
            foreignKeyName: "exercise_responses_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exercise_responses_user_id_fkey"; // From HEAD
            columns: ["user_id"]; // From HEAD
            isOneToOne: false; // From HEAD
            referencedRelation: "users"; // From HEAD
            referencedColumns: ["id"]; // From HEAD
          },
          {
            foreignKeyName: "exercise_responses_exercise_id_fkey"; // From remote
            columns: ["exercise_id"]; // From remote
            isOneToOne: false; // From remote
            referencedRelation: "exercises"; // From remote
            referencedColumns: ["id"]; // From remote
          },
        ];
      };
      exercises: { // From remote
        Row: {
          course_id: string
          created_at: string
          id: string
          metadata: Json | null
          order_index: number | null
          question: string | null
          type: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          order_index?: number | null
          question?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          order_index?: number | null
          question?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: { // From remote
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
