import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { courseId, questionCount, difficulty } = await req.json();

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch revision sheet content
    const { data: fiche, error: ficheError } = await supabaseAdmin
      .from("fiche_revision")
      .select("*, courses!inner(title, subject, user_id)")
      .eq("course_id", courseId)
      .single();

    if (ficheError || !fiche) {
      throw new Error("Fiche de révision introuvable");
    }

    // 2. Generate quiz using AI
    // In production, this would call OpenAI API to generate questions
    // For now, we'll create sample questions

    const questions = [];
    for (let i = 0; i < questionCount; i++) {
      questions.push({
        question: `Question ${i + 1} sur ${fiche.courses.title}`,
        choices: [
          "Réponse A",
          "Réponse B",
          "Réponse C",
          "Réponse D",
        ],
        correctAnswer: 0,
        explanation: "Explication de la réponse correcte",
      });
    }

    // 3. Create exercise in database
    const { data: exercise, error: exerciseError } = await supabaseAdmin
      .from("exercises")
      .insert({
        course_id: courseId,
        user_id: fiche.courses.user_id,
        exercice_title: `Quiz - ${fiche.courses.title}`,
        statut: "disponible",
        metadata: {
          questions,
          difficulty,
          generatedFrom: "revision_sheet",
          totalQuestions: questionCount,
        },
        date_exercice: new Date().toISOString().split("T")[0],
      })
      .select()
      .single();

    if (exerciseError) {
      throw new Error(`Erreur création quiz: ${exerciseError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Quiz généré avec succès",
        exerciseId: exercise.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
