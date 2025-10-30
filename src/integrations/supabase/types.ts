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
      ai_teacher_agent_configs: {
        Row: {
          created_at: string | null
          elevenlabs_agent_id: string | null
          id: string
          last_used_at: string | null
          learning_style: string
          system_prompt: string
          troubles_context: Json
          user_id: string
          voice_id: string | null
        }
        Insert: {
          created_at?: string | null
          elevenlabs_agent_id?: string | null
          id?: string
          last_used_at?: string | null
          learning_style: string
          system_prompt: string
          troubles_context: Json
          user_id: string
          voice_id?: string | null
        }
        Update: {
          created_at?: string | null
          elevenlabs_agent_id?: string | null
          id?: string
          last_used_at?: string | null
          learning_style?: string
          system_prompt?: string
          troubles_context?: Json
          user_id?: string
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_teacher_agent_configs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_teacher_conversations: {
        Row: {
          agent_config: Json
          context_data: Json | null
          context_id: string | null
          conversation_type: string
          created_at: string | null
          deleted_at: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_config: Json
          context_data?: Json | null
          context_id?: string | null
          conversation_type: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_config?: Json
          context_data?: Json | null
          context_id?: string | null
          conversation_type?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_teacher_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_teacher_messages: {
        Row: {
          audio_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_teacher_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_teacher_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
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
          organization_id: string | null
          professor_role: string | null
          qcm_per_day: number | null
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
          organization_id?: string | null
          professor_role?: string | null
          qcm_per_day?: number | null
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
          organization_id?: string | null
          professor_role?: string | null
          qcm_per_day?: number | null
          subject?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          name: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          name: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string | null
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
            referencedRelation: "organization_members_details"
            referencedColumns: ["email"]
          },
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
          {
            foreignKeyName: "error_responses_exercice_id_fkey"
            columns: ["exercice_id"]
            isOneToOne: false
            referencedRelation: "exercises"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "exercise_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
            foreignKeyName: "exercises_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      organization_members: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          id: string
          organization_id: string
          requested_at: string | null
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          organization_id: string
          requested_at?: string | null
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          id?: string
          organization_id?: string
          requested_at?: string | null
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_requests: {
        Row: {
          admin_city: string | null
          admin_country: string
          admin_date_of_birth: string
          admin_email: string
          admin_full_name: string
          admin_phone: string
          created_at: string | null
          created_by: string
          created_organization_id: string | null
          id: string
          organization_description: string
          organization_name: string
          organization_type: string
          organization_website: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_city?: string | null
          admin_country: string
          admin_date_of_birth: string
          admin_email: string
          admin_full_name: string
          admin_phone: string
          created_at?: string | null
          created_by: string
          created_organization_id?: string | null
          id?: string
          organization_description: string
          organization_name: string
          organization_type: string
          organization_website: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_city?: string | null
          admin_country?: string
          admin_date_of_birth?: string
          admin_email?: string
          admin_full_name?: string
          admin_phone?: string
          created_at?: string | null
          created_by?: string
          created_organization_id?: string | null
          id?: string
          organization_description?: string
          organization_name?: string
          organization_type?: string
          organization_website?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_requests_created_organization_id_fkey"
            columns: ["created_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          max_members: number | null
          name: string
          organization_code: string
          type: string | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          validation_status: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          max_members?: number | null
          name: string
          organization_code: string
          type?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          max_members?: number | null
          name?: string
          organization_code?: string
          type?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string | null
          website?: string | null
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
          date_of_birth: string | null
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
          profile_completed: boolean | null
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
          date_of_birth?: string | null
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
          profile_completed?: boolean | null
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
          date_of_birth?: string | null
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
          profile_completed?: boolean | null
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
          score_kinesthésique: number | null
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
          score_kinesthésique?: number | null
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
          score_kinesthésique?: number | null
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
      user_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          course_id: string
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          organization_id: string | null
          updated_at: string | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          organization_id?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          organization_id?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress_snapshots: {
        Row: {
          average_score: number | null
          courses_generated: number | null
          created_at: string | null
          date: string
          documents_uploaded: number | null
          errors_made: number | null
          errors_resolved: number | null
          exercises_completed: number | null
          flashcards_reviewed: number | null
          id: string
          organization_id: string | null
          quizzes_completed: number | null
          quizzes_passed: number | null
          readiness_score: number | null
          ready_for_exam: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_score?: number | null
          courses_generated?: number | null
          created_at?: string | null
          date?: string
          documents_uploaded?: number | null
          errors_made?: number | null
          errors_resolved?: number | null
          exercises_completed?: number | null
          flashcards_reviewed?: number | null
          id?: string
          organization_id?: string | null
          quizzes_completed?: number | null
          quizzes_passed?: number | null
          readiness_score?: number | null
          ready_for_exam?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_score?: number | null
          courses_generated?: number | null
          created_at?: string | null
          date?: string
          documents_uploaded?: number | null
          errors_made?: number | null
          errors_resolved?: number | null
          exercises_completed?: number | null
          flashcards_reviewed?: number | null
          id?: string
          organization_id?: string | null
          quizzes_completed?: number | null
          quizzes_passed?: number | null
          readiness_score?: number | null
          ready_for_exam?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_teacher_user_stats: {
        Row: {
          active_conversations: number | null
          course_conversations: number | null
          ended_conversations: number | null
          exercise_conversations: number | null
          general_conversations: number | null
          last_conversation_at: string | null
          quiz_conversations: number | null
          total_conversations: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_teacher_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organization_members_details: {
        Row: {
          approved_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          organization_code: string | null
          organization_id: string | null
          organization_name: string | null
          profile_photo_url: string | null
          requested_at: string | null
          role: string | null
          status: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      calculate_readiness_score: {
        Args: { target_user_id: string }
        Returns: number
      }
      delete_user_account: { Args: never; Returns: Json }
      generate_organization_code: { Args: never; Returns: string }
      sync_all_emails: { Args: never; Returns: undefined }
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
