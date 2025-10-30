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
    const { courseId, options } = await req.json();

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Fetch course content
    const { data: course, error: courseError } = await supabaseAdmin
      .from("courses")
      .select("course_content, title, subject, user_id")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      throw new Error("Course not found");
    }

    // 2. Generate revision sheet content using AI (OpenAI or similar)
    // For this example, we'll create a simple formatted text
    // In production, you would call OpenAI GPT-4 API here

    let revisionContent = `# Fiche de Révision: ${course.title}\n\n`;
    revisionContent += `**Matière:** ${course.subject}\n\n`;

    if (options.includeConcepts) {
      revisionContent += `## Concepts Clés\n\n`;
      revisionContent += `${course.course_content?.substring(0, 500) || 'Contenu du cours'}\n\n`;
    }

    if (options.includeDefinitions) {
      revisionContent += `## Définitions Importantes\n\n`;
      revisionContent += `[Définitions extraites du cours]\n\n`;
    }

    if (options.includeExamples) {
      revisionContent += `## Exemples Pratiques\n\n`;
      revisionContent += `[Exemples illustratifs]\n\n`;
    }

    if (options.includeExercises) {
      revisionContent += `## Exercices d'Entraînement\n\n`;
      revisionContent += `[Exercices de pratique]\n\n`;
    }

    // 3. Convert to PDF or save as Markdown
    // For simplicity, we'll save as a text file
    const fileName = `fiche_revision_${courseId}_${Date.now()}.txt`;
    const encoder = new TextEncoder();
    const data = encoder.encode(revisionContent);

    // 4. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("revision-sheets")
      .upload(fileName, data, {
        contentType: "text/plain",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload error: ${uploadError.message}`);
    }

    // 5. Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("revision-sheets")
      .getPublicUrl(fileName);

    // 6. Insert into fiche_revision table
    const { error: insertError } = await supabaseAdmin
      .from("fiche_revision")
      .insert({
        course_id: courseId,
        user_id: course.user_id,
        file_name: fileName,
        file_url: uploadData.path,
      });

    if (insertError) {
      throw new Error(`Database insert error: ${insertError.message}`);
    }

    // 7. Update course status
    await supabaseAdmin
      .from("courses")
      .update({
        fiche_revision_url: urlData.publicUrl,
        fiche_revision_status: "completed",
      })
      .eq("id", courseId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Fiche de révision créée avec succès",
        fileUrl: urlData.publicUrl,
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
