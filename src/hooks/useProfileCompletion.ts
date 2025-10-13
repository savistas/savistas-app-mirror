import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useProfileCompletion = () => {
  const { user } = useAuth();
  const [isProfileComplete, setIsProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) {
        setIsProfileComplete(null);
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('country, education_level, classes, subjects, subscription')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error("Erreur vérification profil:", error);
        setIsProfileComplete(false);
        setLoading(false);
        return;
      }

      const isComplete = profile && 
        !!profile.country && 
        !!profile.education_level && 
        !!profile.classes && 
        !!profile.subjects && 
        !!profile.subscription;

      setIsProfileComplete(isComplete);
      setLoading(false);
    };

    checkProfileCompletion();
  }, [user]);

  return { isProfileComplete, loading };
};