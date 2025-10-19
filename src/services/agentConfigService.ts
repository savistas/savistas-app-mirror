import { supabase } from '@/integrations/supabase/client';

export type ConversationType = 'general' | 'course' | 'quiz' | 'exercise';
export type LearningStyle = 'visuel' | 'auditif' | 'kinesthésique' | 'lecture_ecriture';
export type TroubleLevel = 'Faible' | 'Modéré' | 'Élevé' | 'Très élevé';

export interface UserProfile {
  user_id: string;
  learning_style?: string;
  medical_diagnosis?: string;
}

export interface TroubleScore {
  trouble_name: string;
  level: TroubleLevel;
}

export interface CourseContext {
  course_id: string;
  title: string;
  description?: string;
  content?: string;
}

export interface QuizContext {
  quiz_id: string;
  quiz_title: string;
  errors: QuizError[];
}

export interface QuizError {
  question: string;
  user_answer: string;
  correct_answer: string;
  explanation?: string;
}

export interface AgentConfiguration {
  system_prompt: string;
  learning_style: string;
  troubles_context: TroubleScore[];
  conversation_type: ConversationType;
  context_data?: any;
}

/**
 * Service pour générer des configurations d'agents personnalisés
 * basées sur le profil de l'utilisateur et le contexte
 */
export class AgentConfigService {
  /**
   * Générer une configuration d'agent complète
   */
  async generateAgentConfig(
    userId: string,
    conversationType: ConversationType,
    contextData?: CourseContext | QuizContext | null
  ): Promise<AgentConfiguration> {
    // 1. Récupérer le profil utilisateur
    const profile = await this.getUserProfile(userId);

    // 2. Récupérer les scores de troubles
    const troubles = await this.getTroublesScores(userId);

    // 3. Construire le prompt système
    const systemPrompt = this.buildSystemPrompt(
      profile,
      troubles,
      conversationType,
      contextData
    );

    return {
      system_prompt: systemPrompt,
      learning_style: profile.learning_style || 'général',
      troubles_context: troubles,
      conversation_type: conversationType,
      context_data: contextData,
    };
  }

  /**
   * Récupérer le profil utilisateur depuis Supabase
   */
  private async getUserProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, learning_style, medical_diagnosis')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Erreur récupération profil:', error);
      throw error;
    }

    return data;
  }

  /**
   * Récupérer les scores de troubles détectés
   */
  private async getTroublesScores(userId: string): Promise<TroubleScore[]> {
    const { data, error } = await supabase
      .from('troubles_detection_scores')
      .select('trouble_name, level')
      .eq('user_id', userId);

    if (error) {
      console.error('Erreur récupération troubles:', error);
      return [];
    }

    // Filtrer uniquement les troubles significatifs (pas "Faible")
    return (data || []).filter(t => t.level !== 'Faible');
  }

  /**
   * Construire le prompt système personnalisé
   */
  private buildSystemPrompt(
    profile: UserProfile,
    troubles: TroubleScore[],
    conversationType: ConversationType,
    contextData?: any
  ): string {
    let prompt = `Tu es un professeur virtuel bienveillant et patient sur la plateforme Savistas AI-Cademy.

Ta mission est d'aider les étudiants à comprendre et maîtriser leurs cours en adaptant ton enseignement à leur profil unique.

`;

    // 1. Ajouter le contexte du diagnostic médical (prioritaire)
    if (profile.medical_diagnosis) {
      prompt += `🔵 DIAGNOSTIC MÉDICAL:
L'étudiant a déclaré avoir: ${profile.medical_diagnosis}
Tu dois adapter ton approche pédagogique en conséquence.

`;
    }

    // 2. Ajouter les adaptations selon les troubles détectés
    if (troubles.length > 0) {
      prompt += `📊 TROUBLES D'APPRENTISSAGE DÉTECTÉS:\n`;
      troubles.forEach(trouble => {
        prompt += `- ${trouble.trouble_name}: ${trouble.level}\n`;
        prompt += this.getTroubleAdaptation(trouble.trouble_name, trouble.level);
      });
      prompt += '\n';
    }

    // 3. Ajouter les adaptations selon le style d'apprentissage
    if (profile.learning_style) {
      prompt += `🎨 STYLE D'APPRENTISSAGE: ${profile.learning_style}\n`;
      prompt += this.getLearningStyleAdaptation(profile.learning_style);
      prompt += '\n';
    }

    // 4. Ajouter le contexte spécifique de la conversation
    prompt += this.getConversationContext(conversationType, contextData);

    // 5. Ajouter les instructions générales
    prompt += `
📋 INSTRUCTIONS GÉNÉRALES:
- Réponds TOUJOURS en français
- Utilise un ton encourageant et positif
- Décompose les concepts complexes en étapes simples
- Fournis des exemples concrets et pertinents
- Vérifie la compréhension régulièrement
- N'hésite pas à répéter ou reformuler si nécessaire
- Célèbre les progrès de l'étudiant

⚠️ LIMITES:
- Ne fais jamais les exercices à la place de l'étudiant
- Guide plutôt que de donner directement la réponse
- Si tu ne connais pas la réponse, dis-le honnêtement
- Reste dans le domaine pédagogique

Commence toujours par saluer l'étudiant chaleureusement et demande comment tu peux l'aider aujourd'hui.
`;

    return prompt;
  }

  /**
   * Obtenir les adaptations spécifiques à un trouble
   */
  private getTroubleAdaptation(troubleName: string, level: TroubleLevel): string {
    const adaptations: Record<string, Record<TroubleLevel, string>> = {
      'Dyslexie': {
        'Faible': '',
        'Modéré': '  → Utilise des phrases courtes et un vocabulaire simple\n',
        'Élevé': '  → Utilise des phrases TRÈS courtes, évite les mots complexes, structure clairement tes réponses\n',
        'Très élevé': '  → Phrases ultra-courtes, vocabulaire basique, utilise des puces, répète les concepts clés\n',
      },
      'TDAH': {
        'Faible': '',
        'Modéré': '  → Sois concis, divise en petites étapes, encourage fréquemment\n',
        'Élevé': '  → Sois TRÈS concis, 1 étape à la fois, feedback immédiat, encourage activement\n',
        'Très élevé': '  → Ultra-concis, micro-étapes, feedback constant, utilise des émojis pour maintenir l\'attention\n',
      },
      'Dyscalculie': {
        'Faible': '',
        'Modéré': '  → Utilise des représentations visuelles pour les nombres, évite les calculs mentaux complexes\n',
        'Élevé': '  → Utilise BEAUCOUP de visuels, décompose chaque opération, fournis des aide-mémoires\n',
        'Très élevé': '  → Représentations visuelles systématiques, pas de calcul mental, étapes ultra-détaillées\n',
      },
      'Dyspraxie': {
        'Faible': '',
        'Modéré': '  → Privilégie les explications orales aux instructions écrites complexes\n',
        'Élevé': '  → Instructions orales détaillées, évite les manipulations complexes\n',
        'Très élevé': '  → Instructions orales uniquement, décompose chaque geste, utilise des analogies simples\n',
      },
      'Dysorthographie': {
        'Faible': '',
        'Modéré': '  → Ne corrige pas l\'orthographe, concentre-toi sur le contenu\n',
        'Élevé': '  → Ignore complètement l\'orthographe, valorise les idées, fournis les mots difficiles\n',
        'Très élevé': '  → Aucune attention à l\'orthographe, propose des alternatives orales\n',
      },
      // Ajouter d'autres troubles selon la base de données
    };

    return adaptations[troubleName]?.[level] || '';
  }

  /**
   * Obtenir les adaptations selon le style d'apprentissage
   */
  private getLearningStyleAdaptation(learningStyle: string): string {
    const adaptations: Record<string, string> = {
      'visuel': `  → Utilise des métaphores visuelles et des descriptions imagées
  → Propose des diagrammes ou schémas conceptuels
  → Utilise des expressions comme "imagine que...", "visualise..."
`,
      'auditif': `  → Explique avec des analogies sonores et musicales
  → Répète les concepts clés de différentes façons
  → Encourage la discussion et le questionnement oral
`,
      'kinesthésique': `  → Propose des exercices pratiques et des expérimentations
  → Utilise des exemples concrets de la vie quotidienne
  → Encourage la manipulation mentale d'objets ou concepts
`,
      'lecture_ecriture': `  → Fournis des résumés structurés avec des listes
  → Utilise des définitions précises
  → Propose des références de lecture supplémentaires
`,
    };

    return adaptations[learningStyle.toLowerCase()] || adaptations['visuel'];
  }

  /**
   * Obtenir le contexte spécifique de la conversation
   */
  private getConversationContext(
    conversationType: ConversationType,
    contextData?: any
  ): string {
    switch (conversationType) {
      case 'general':
        return `🗣️ MODE: Conversation générale
Tu es disponible pour répondre à toutes les questions de l'étudiant, qu'elles concernent ses cours, ses devoirs, ou sa méthodologie d'apprentissage.

`;

      case 'course':
        if (!contextData) return '';
        const course = contextData as CourseContext;
        return `📚 MODE: Aide sur un cours spécifique
COURS: ${course.title}
${course.description ? `DESCRIPTION: ${course.description}\n` : ''}
${course.content ? `CONTENU:\n${course.content}\n` : ''}

Tu es un expert dans ce cours. Aide l'étudiant à comprendre les concepts, réponds à ses questions, et guide-le dans son apprentissage de cette matière spécifique.

`;

      case 'quiz':
        if (!contextData) return '';
        const quiz = contextData as QuizContext;
        return `❌ MODE: Explication d'erreurs de quiz
QUIZ: ${quiz.quiz_title}

ERREURS DE L'ÉTUDIANT:
${quiz.errors.map((e, i) => `
${i + 1}. QUESTION: ${e.question}
   RÉPONSE DONNÉE: ${e.user_answer}
   BONNE RÉPONSE: ${e.correct_answer}
   ${e.explanation ? `EXPLICATION: ${e.explanation}` : ''}
`).join('\n')}

Ton rôle est d'expliquer POURQUOI ces réponses sont incorrectes et d'aider l'étudiant à comprendre les concepts sous-jacents. Ne te contente pas de répéter la bonne réponse, mais explique le raisonnement.

`;

      case 'exercise':
        return `✍️ MODE: Aide sur un exercice
L'étudiant travaille sur un exercice spécifique. Guide-le pas à pas sans faire l'exercice à sa place. Pose des questions pour vérifier sa compréhension.

`;

      default:
        return '';
    }
  }

  /**
   * Sauvegarder une configuration d'agent dans la base de données
   */
  async saveAgentConfig(
    userId: string,
    config: AgentConfiguration,
    elevenLabsAgentId?: string
  ): Promise<string> {
    const { data, error } = await supabase
      .from('ai_teacher_agent_configs')
      .insert({
        user_id: userId,
        learning_style: config.learning_style,
        troubles_context: config.troubles_context,
        system_prompt: config.system_prompt,
        elevenlabs_agent_id: elevenLabsAgentId,
        last_used_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) {
      console.error('Erreur sauvegarde config:', error);
      throw error;
    }

    return data.id;
  }

  /**
   * Récupérer une configuration d'agent existante
   */
  async getExistingAgentConfig(
    userId: string,
    learningStyle: string,
    conversationType: ConversationType
  ): Promise<any | null> {
    const { data, error } = await supabase
      .from('ai_teacher_agent_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('learning_style', learningStyle)
      .order('last_used_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erreur récupération config:', error);
      return null;
    }

    return data;
  }

  /**
   * Mettre à jour la date de dernière utilisation
   */
  async updateLastUsed(configId: string): Promise<void> {
    await supabase
      .from('ai_teacher_agent_configs')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', configId);
  }
}

// Instance singleton
export const agentConfigService = new AgentConfigService();
