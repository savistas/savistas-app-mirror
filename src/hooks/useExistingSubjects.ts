import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useExistingSubjects = () => {
  return useQuery({
    queryKey: ["existing-subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("subject")
        .not("subject", "is", null);

      if (error) throw error;

      // Extraire les matières uniques et les trier alphabétiquement
      const uniqueSubjects = Array.from(
        new Set(data.map((course) => course.subject).filter(Boolean))
      ).sort();

      return uniqueSubjects as string[];
    },
  });
};
