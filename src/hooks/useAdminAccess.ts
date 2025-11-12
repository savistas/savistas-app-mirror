import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook pour vérifier si l'utilisateur connecté est l'admin Savistas
 * Seul contact.savistas@gmail.com a accès au backoffice de validation des organisations
 */
export const useAdminAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Attendre que l'authentification soit chargée
    if (authLoading) {
      return;
    }

    // Vérifier l'email admin
    if (user?.email === 'contact.savistas@gmail.com') {
      setIsAdmin(true);
      hasCheckedRef.current = true;
    } else if (user?.email && user.email !== 'contact.savistas@gmail.com') {
      // Utilisateur connecté mais pas admin
      setIsAdmin(false);
      hasCheckedRef.current = true;
    }
    // Si user est null mais on a déjà vérifié, ne pas changer l'état immédiatement
    // (peut être un refresh de session temporaire)

    setLoading(false);
  }, [user, authLoading]);

  return {
    isAdmin,
    loading,
    adminEmail: 'contact.savistas@gmail.com',
  };
};
