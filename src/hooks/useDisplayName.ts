import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to get user's display name with immediate fallback to avoid flash of "Mon profil"
 * Priority order: full_name from DB > full_name from auth metadata > email
 */
export const useDisplayName = () => {
  const { user } = useAuth();

  // Initialize with immediate available data to avoid flash
  const [displayName, setDisplayName] = useState<string>(() => {
    if (!user) return '';
    return user.user_metadata?.full_name || user.email || '';
  });

  useEffect(() => {
    if (!user) {
      setDisplayName('');
      return;
    }

    // Set immediate fallback first
    const immediateName = user.user_metadata?.full_name || user.email || '';
    setDisplayName(immediateName);

    // Then fetch from database to get the most up-to-date value
    let mounted = true;

    const fetchDisplayName = async () => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (mounted && profileData) {
        const dbName = profileData.full_name || profileData.email || immediateName;
        setDisplayName(dbName);
      }
    };

    fetchDisplayName();

    return () => {
      mounted = false;
    };
  }, [user]);

  return displayName;
};
