import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseOrganizationCodeReturn {
  validateCode: (code: string) => Promise<{ organizationId: string; organizationName: string } | null>;
  isValidating: boolean;
  error: string | null;
  clearError: () => void;
}

export function useOrganizationCode(): UseOrganizationCodeReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  /**
   * Valider un code d'organisation
   * Retourne l'ID et le nom de l'organisation si le code est valide
   */
  const validateCode = async (code: string): Promise<{ organizationId: string; organizationName: string } | null> => {
    if (!code || code.trim() === '') {
      setError('Veuillez entrer un code d\'organisation');
      return null;
    }

    setIsValidating(true);
    setError(null);

    try {
      // 1. Vérifier si l'organisation existe avec ce code
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, validation_status')
        .eq('organization_code', code.trim().toUpperCase())
        .maybeSingle();

      if (orgError) {
        console.error('Organization lookup error:', orgError);
        setError('Erreur de connexion, réessayez');
        return null;
      }

      if (!org) {
        setError('Code d\'organisation invalide');
        return null;
      }

      // 2. Vérifier que l'organisation est approuvée
      if (org.validation_status !== 'approved') {
        setError('Cette organisation n\'est pas encore validée');
        return null;
      }

      return {
        organizationId: org.id,
        organizationName: org.name,
      };
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erreur inattendue, réessayez');
      return null;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateCode,
    isValidating,
    error,
    clearError,
  };
}
