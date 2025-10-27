import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseOrganizationCodeReturn {
  validateCode: (code: string) => Promise<{ organizationId: string; organizationName: string } | null>;
  joinOrganization: (userId: string, organizationId: string) => Promise<boolean>;
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

  /**
   * Rejoindre une organisation
   * Ajoute l'utilisateur comme membre avec le statut "active"
   */
  const joinOrganization = async (userId: string, organizationId: string): Promise<boolean> => {
    try {
      // 1. Vérifier si l'utilisateur est déjà membre
      const { data: existing } = await supabase
        .from('organization_members')
        .select('id, status')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'active') {
          setError('Vous êtes déjà membre de cette organisation');
        } else {
          setError('Votre demande d\'adhésion est en cours de traitement');
        }
        return false;
      }

      // 2. Ajouter comme membre avec statut "active" (adhésion via code = approbation automatique)
      const { error: insertError } = await supabase
        .from('organization_members')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          role: 'student',
          status: 'active',
          approved_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error adding member:', insertError);
        setError('Erreur lors de l\'ajout à l\'organisation');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Erreur inattendue lors de l\'adhésion');
      return false;
    }
  };

  return {
    validateCode,
    joinOrganization,
    isValidating,
    error,
    clearError,
  };
}
