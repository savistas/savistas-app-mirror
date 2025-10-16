/**
 * Service pour envoyer les erreurs des QCM au webhook N8N
 * pour catégorisation automatique
 */

interface QuizError {
  matiere: string;
  question: string;
  reponse_fausse: string;
  bonne_reponse: string;
  explication: string;
  question_index: string;
  time_spent_seconds?: number;
}

interface WebhookPayload {
  user_id: string;
  exercise_id: string;
  course_id: string;
  errors: QuizError[];
  timestamp: string;
  total_time_seconds?: number;
}

const N8N_WEBHOOK_URL = "https://n8n.srv932562.hstgr.cloud/webhook/error-categorization";

/**
 * Envoie les erreurs d'un QCM complété au webhook N8N
 * @param exerciseId - ID de l'exercice
 * @param courseId - ID du cours
 * @param userId - ID de l'utilisateur
 * @param subject - Matière du cours
 * @param questions - Tableau des questions de l'exercice
 * @param userResponses - Réponses de l'utilisateur
 * @param totalTimeSeconds - Temps total en secondes pour compléter le QCM
 */
export async function sendQuizErrorsToWebhook(
  exerciseId: string,
  courseId: string,
  userId: string,
  subject: string,
  questions: Array<{
    question_index: string;
    question_titre: string;
    explication_reponse_correcte: string;
    reponses: Array<{
      texte: string;
      lettre: string;
      correcte: string;
    }>;
  }>,
  userResponses: Array<{
    question_index: string;
    user_answer: string;
    is_correct_sub_question?: boolean;
    time_spent_seconds?: number;
  }>,
  totalTimeSeconds?: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Filtrer uniquement les erreurs (réponses incorrectes)
    const errors: QuizError[] = userResponses
      .filter(response => response.is_correct_sub_question === false)
      .map(response => {
        // Trouver la question correspondante
        const question = questions.find(q => q.question_index === response.question_index);

        if (!question) {
          console.warn(`Question ${response.question_index} not found`);
          return null;
        }

        // Trouver la bonne réponse
        const correctAnswer = question.reponses.find(r => r.correcte === "true");

        // Trouver la réponse fausse de l'utilisateur
        const userAnswer = question.reponses.find(r => r.lettre === response.user_answer);

        if (!correctAnswer || !userAnswer) {
          console.warn(`Answer not found for question ${response.question_index}`);
          return null;
        }

        return {
          matiere: subject,
          question: question.question_titre,
          reponse_fausse: `${userAnswer.lettre}. ${userAnswer.texte}`,
          bonne_reponse: `${correctAnswer.lettre}. ${correctAnswer.texte}`,
          explication: question.explication_reponse_correcte,
          question_index: response.question_index,
          time_spent_seconds: response.time_spent_seconds
        };
      })
      .filter((error): error is QuizError => error !== null);

    // Si aucune erreur, ne pas envoyer de requête
    if (errors.length === 0) {
      console.log("No errors to send - all answers correct!");
      return { success: true };
    }

    // Construire le payload
    const payload: WebhookPayload = {
      user_id: userId,
      exercise_id: exerciseId,
      course_id: courseId,
      errors,
      timestamp: new Date().toISOString(),
      total_time_seconds: totalTimeSeconds
    };

    console.log("Sending errors to N8N webhook:", payload);

    // Envoyer au webhook N8N
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`);
    }

    console.log("Errors sent successfully to N8N");
    return { success: true };

  } catch (error) {
    console.error("Error sending quiz errors to webhook:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
