export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles_infos: {
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
      profiles: {
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
      courses: {
        Row: {
          id: string
          created_at: string
          title: string
          subject: string
          level: string
          description: string | null
          file_url: Json // Changed to Json
          cover_url: Json | null // Changed to Json
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          subject: string
          level: string
          description?: string | null
          file_url: Json // Changed to Json
          cover_url?: Json | null // Changed to Json
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          subject?: string
          level?: string
          description?: string | null
          file_url?: Json // Changed to Json
          cover_url?: Json | null // Changed to Json
          user_id?: string
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
      exercise_responses: {
        Row: {
          id: string;
          created_at: string;
          is_correct: boolean | null;
          score: number | null;
          course_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          is_correct?: boolean | null;
          score?: number | null;
          course_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          is_correct?: boolean | null;
          score?: number | null;
          course_id?: string;
          user_id?: string;
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
            foreignKeyName: "exercise_responses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
