import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook pour vérifier si l'utilisateur connecté est l'admin Savistas
 * Seul contact.savistas@gmail.com a accès au backoffice de validation des organisations
 */
export const useAdminAccess = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      setIsAdmin(user.email === 'contact.savistas@gmail.com');
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [user]);

  return {
    isAdmin,
    loading,
    adminEmail: 'contact.savistas@gmail.com',
  };
};
