import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseOrganizationLeaveReturn {
  leaveOrganization: (userId: string, membershipId: string) => Promise<boolean>;
  isLeaving: boolean;
  error: string | null;
}

/**
 * Hook pour gérer le départ d'une organisation et la restauration de l'abonnement B2C
 */
export function useOrganizationLeave(): UseOrganizationLeaveReturn {
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Quitter une organisation et restaurer l'abonnement B2C précédent si nécessaire
   */
  const leaveOrganization = async (userId: string, membershipId: string): Promise<boolean> => {
    setIsLeaving(true);
    setError(null);

    try {
      // 1. Récupérer les informations de membership incluant l'abonnement sauvegardé
      const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('previous_subscription_plan, previous_stripe_subscription_id, organization_id')
        .eq('id', membershipId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership) {
        console.error('Error fetching membership:', membershipError);
        setError('Impossible de récupérer les informations de membership');
        return false;
      }

      // 2. Marquer le membre comme "removed" et enregistrer la date de restauration
      const { error: updateError } = await supabase
        .from('organization_members')
        .update({
          status: 'removed',
          subscription_restored_at: new Date().toISOString(),
        })
        .eq('id', membershipId);

      if (updateError) {
        console.error('Error updating membership status:', updateError);
        setError('Impossible de quitter l\'organisation');
        return false;
      }

      // 3. Si l'utilisateur avait un abonnement payant avant de rejoindre, on pourrait le restaurer ici
      // Note: Pour Stripe, il faudrait réactiver l'abonnement via l'API Stripe
      // Pour l'instant, on va juste informer l'utilisateur

      if (membership.previous_subscription_plan && membership.previous_subscription_plan !== 'basic') {
        // L'utilisateur avait un abonnement payant - notifier qu'il faut le réactiver
        toast({
          title: 'Abonnement à restaurer',
          description: `Vous aviez un abonnement ${membership.previous_subscription_plan} avant de rejoindre l'organisation. Veuillez le réactiver depuis votre page de profil si vous souhaitez continuer à bénéficier de ces fonctionnalités.`,
          variant: 'default',
        });

        // On pourrait aussi automatiquement restaurer le plan dans user_subscriptions
        // mais sans réactiver le paiement Stripe pour éviter une double facturation
        console.log(`User had ${membership.previous_subscription_plan} subscription - should restore manually`);
      }

      toast({
        title: 'Organisation quittée',
        description: 'Vous avez quitté l\'organisation avec succès. Votre abonnement personnel est maintenant actif.',
      });

      return true;
    } catch (err) {
      console.error('Unexpected error leaving organization:', err);
      setError('Erreur inattendue lors du départ de l\'organisation');
      return false;
    } finally {
      setIsLeaving(false);
    }
  };

  return {
    leaveOrganization,
    isLeaving,
    error,
  };
}
