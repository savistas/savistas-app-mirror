/**
 * Service pour générer des system prompts personnalisés pour les agents ElevenLabs
 * Basé sur les styles d'apprentissage et le contexte de conversation
 */

import { LearningStyleScore, generateStyleDirectives } from './learningStylesAnalyzer';

/**
 * Type de contexte pour la conversation
 */
export type ConversationType = 'general' | 'course' | 'exercise' | 'error';

/**
 * Données de contexte pour générer le prompt
 */
export interface PromptContext {
  conversationType: ConversationType;
  courseName?: string;
  courseContent?: string;
  professorRole?: string;
  exerciseTitle?: string;
  exerciseContent?: string;
  errorDescription?: string;
  errorContext?: string;
  errorCategory?: string;
  additionalInstructions?: string; // Instructions supplémentaires de l'utilisateur
}

/**
 * Configuration complète pour créer un agent
 */
export interface AgentConfig {
  systemPrompt: string;
  firstMessage: string;
  conversationType: ConversationType;
  contextSummary: string;
}

/**
 * Générer le prompt de base selon le type de conversation
 */
function generateBasePrompt(type: ConversationType): string {
  switch (type) {
    case 'general':
      return `Tu es un professeur virtuel bienveillant et pédagogue sur la plateforme Savistas AI-Cademy.
Ta mission est d'accompagner l'apprenant dans son parcours d'apprentissage de manière personnalisée et adaptée.

Tu dois :
- Répondre aux questions de l'apprenant avec patience et clarté
- Encourager la curiosité et la réflexion
- Adapter ton vocabulaire au niveau de l'apprenant
- Être positif et motivant dans tes interactions
- Fournir des explications progressives et structurées`;

    case 'course':
      return `Tu es un professeur virtuel spécialisé qui accompagne l'apprenant dans l'étude d'un cours spécifique.
Ta mission est d'aider l'apprenant à comprendre et maîtriser le contenu du cours.

Tu dois :
- Expliquer les concepts du cours de manière claire et progressive
- Répondre aux questions sur le contenu
- Proposer des exemples concrets pour illustrer
- Vérifier la compréhension régulièrement
- Encourager l'apprenant à poser des questions`;

    case 'exercise':
      return `Tu es un professeur virtuel qui guide l'apprenant dans la résolution d'un exercice.
Ta mission est d'accompagner sans donner directement la réponse, mais en guidant la réflexion.

Tu dois :
- Aider l'apprenant à comprendre l'énoncé
- Poser des questions qui orientent vers la solution
- Fournir des indices progressifs si nécessaire
- Valider les étapes de raisonnement
- Célébrer les réussites et encourager en cas de difficulté`;

    case 'error':
      return `Tu es un professeur virtuel bienveillant qui aide l'apprenant à comprendre et corriger ses erreurs.
Ta mission est de transformer l'erreur en opportunité d'apprentissage.

Tu dois :
- Analyser l'erreur avec bienveillance (pas de jugement)
- Identifier la source de l'incompréhension
- Réexpliquer le concept concerné différemment
- Proposer une méthode pour éviter cette erreur
- Encourager et valoriser l'effort de correction`;

    default:
      return generateBasePrompt('general');
  }
}

/**
 * Générer la section de contexte spécifique
 */
function generateContextSection(context: PromptContext): string {
  const sections: string[] = [];

  if (context.conversationType === 'course' && context.courseContent) {
    sections.push(`\n## Contenu du cours\n\nTitre: ${context.courseName || 'Sans titre'}`);

    if (context.professorRole) {
      sections.push(`Rôle du professeur: ${context.professorRole}`);
    }

    sections.push(`\nContenu:\n${context.courseContent}`);
    sections.push(`\nTu dois te baser sur ce contenu pour tes explications et rester dans le cadre de ce cours.`);
  }

  if (context.conversationType === 'exercise' && context.exerciseContent) {
    sections.push(`\n## Exercice à résoudre\n\nTitre: ${context.exerciseTitle || 'Exercice'}`);
    sections.push(`\nÉnoncé:\n${context.exerciseContent}`);
    sections.push(`\nGuide l'apprenant vers la solution sans donner directement la réponse.`);
  }

  if (context.conversationType === 'error' && context.errorDescription) {
    sections.push(`\n## Erreur à analyser\n\n${context.errorDescription}`);
    if (context.errorCategory) {
      sections.push(`\nCatégorie: ${context.errorCategory}`);
    }
    if (context.errorContext) {
      sections.push(`\nContexte:\n${context.errorContext}`);
    }
    sections.push(`\nAide l'apprenant à comprendre pourquoi cette erreur s'est produite et comment la corriger.`);
  }

  // Instructions supplémentaires de l'utilisateur
  if (context.additionalInstructions) {
    sections.push(`\n## 💬 Instructions supplémentaires de l'utilisateur\n\n${context.additionalInstructions}`);
    sections.push(`\nCes instructions sont PRIORITAIRES et doivent être prises en compte dans ta façon d'enseigner.`);
  }

  return sections.join('\n');
}

/**
 * Générer le message d'accueil selon le contexte
 */
function generateFirstMessage(context: PromptContext): string {
  switch (context.conversationType) {
    case 'general':
      return "Bonjour ! Je suis ton professeur virtuel. Comment puis-je t'aider aujourd'hui ?";

    case 'course':
      return `Bonjour ! Je suis là pour t'accompagner dans l'étude du cours "${context.courseName || 'ce cours'}". Par quoi aimerais-tu commencer ?`;

    case 'exercise':
      return `Bonjour ! Je vais t'aider avec l'exercice "${context.exerciseTitle || 'cet exercice'}". As-tu des questions sur l'énoncé ou veux-tu commencer directement ?`;

    case 'error':
      return "Bonjour ! Ne t'inquiète pas, les erreurs sont des opportunités d'apprentissage. Parlons ensemble de ce qui s'est passé et comment progresser.";

    default:
      return generateFirstMessage({ conversationType: 'general' });
  }
}

/**
 * Générer un résumé du contexte pour les métadonnées
 */
function generateContextSummary(context: PromptContext): string {
  const parts: string[] = [context.conversationType];

  if (context.courseName) parts.push(context.courseName);
  if (context.exerciseTitle) parts.push(context.exerciseTitle);
  if (context.errorCategory) parts.push(context.errorCategory);

  return parts.join(' - ');
}

/**
 * Générer une version COMPACTE du prompt (< 5000 caractères)
 * Pour éviter les rejets API ElevenLabs
 */
function generateCompactPrompt(
  dominantStyles: LearningStyleScore[],
  context: PromptContext
): string {
  const parts: string[] = [];

  // 1. Rôle de base (court)
  if (context.conversationType === 'course') {
    parts.push(`Tu es un professeur qui aide l'apprenant avec le cours "${context.courseName || 'ce cours'}".`);
  } else if (context.conversationType === 'exercise') {
    parts.push(`Tu es un professeur qui guide l'apprenant pour l'exercice "${context.exerciseTitle || 'cet exercice'}".`);
  } else if (context.conversationType === 'error') {
    parts.push(`Tu es un professeur bienveillant qui aide l'apprenant à comprendre ses erreurs.`);
  } else {
    parts.push(`Tu es un professeur bienveillant et pédagogue.`);
  }

  // 2. Styles d'apprentissage (version compacte)
  if (dominantStyles && dominantStyles.length > 0) {
    const stylesText = dominantStyles
      .slice(0, 3)
      .map(s => s?.name)
      .filter(Boolean)
      .join(', ');

    if (stylesText) {
      parts.push(`\nStyles d'apprentissage de l'apprenant: ${stylesText}.`);

      // Directives ultra-courtes
      const topStyle = dominantStyles[0];
      if (topStyle?.directive_ia && topStyle.directive_ia.length > 0) {
        parts.push(`Adapte ta pédagogie: ${topStyle.directive_ia[0]}`);
      }
    }
  }

  // 3. Contexte spécifique (très résumé)
  if (context.conversationType === 'course' && context.courseContent) {
    // Limiter le contenu du cours à 1000 caractères max
    const shortContent = context.courseContent.substring(0, 1000);
    parts.push(`\nContenu du cours:\n${shortContent}${context.courseContent.length > 1000 ? '...' : ''}`);
  }

  if (context.conversationType === 'exercise' && context.exerciseContent) {
    // Limiter l'exercice à 800 caractères max
    const shortExercise = context.exerciseContent.substring(0, 800);
    parts.push(`\nExercice:\n${shortExercise}${context.exerciseContent.length > 800 ? '...' : ''}`);
  }

  if (context.conversationType === 'error' && context.errorDescription) {
    parts.push(`\nErreur: ${context.errorDescription}`);
    if (context.errorCategory) {
      parts.push(`Catégorie: ${context.errorCategory}`);
    }
  }

  // 4. Instructions supplémentaires
  if (context.additionalInstructions) {
    parts.push(`\nInstructions spéciales: ${context.additionalInstructions}`);
  }

  // 5. Règles courtes
  parts.push(`\nSois bienveillant, patient, et encourage l'apprenant.`);

  return parts.join('\n');
}

/**
 * Générer la configuration complète de l'agent personnalisé
 */
export function generateAgentConfig(
  dominantStyles: LearningStyleScore[],
  context: PromptContext
): AgentConfig {
  // Version COMPACTE pour éviter les rejets API
  const systemPrompt = generateCompactPrompt(dominantStyles, context);

  // Message d'accueil
  const firstMessage = generateFirstMessage(context);

  // Résumé du contexte
  const contextSummary = generateContextSummary(context);

  console.log('📏 [PROMPT] Longueur finale:', systemPrompt.length, 'caractères');

  return {
    systemPrompt,
    firstMessage,
    conversationType: context.conversationType,
    contextSummary,
  };
}

/**
 * Exemple d'utilisation :
 *
 * const dominantStyles = analyzeLearningStyles(userData);
 * const context: PromptContext = {
 *   conversationType: 'course',
 *   courseName: 'Introduction à JavaScript',
 *   courseContent: '...',
 *   professorRole: 'Expert en développement web'
 * };
 *
 * const agentConfig = generateAgentConfig(dominantStyles.top3, context);
 * // Utiliser agentConfig.systemPrompt pour créer l'agent ElevenLabs
 */
