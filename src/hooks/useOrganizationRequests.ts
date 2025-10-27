import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface OrganizationRequest {
  id: string;
  organization_name: string;
  organization_description: string;
  organization_website: string;
  organization_type: 'school' | 'company';
  created_by: string;
  admin_full_name: string;
  admin_date_of_birth: string;
  admin_phone: string;
  admin_country: string;
  admin_city: string | null;
  admin_email: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useOrganizationRequests = (adminMode = false) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<OrganizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from('organization_requests').select('*');

      if (!adminMode) {
        // Mode utilisateur : voir uniquement ses propres demandes
        query = query.eq('created_by', user.id);
      }
      // En mode admin, la RLS policy se charge de vérifier l'email

      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching organization requests:', fetchError);
        setError(fetchError.message);
        setRequests([]);
      } else {
        setRequests(data || []);
        setError(null);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Une erreur inattendue est survenue');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // S'abonner aux changements en temps réel
    const subscription = supabase
      .channel('organization_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_requests',
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, adminMode]);

  /**
   * Créer une nouvelle demande d'organisation
   */
  const createRequest = async (requestData: {
    organization_name: string;
    organization_description: string;
    organization_website: string;
    organization_type: 'school' | 'company';
    admin_full_name: string;
    admin_date_of_birth: string;
    admin_phone: string;
    admin_country: string;
    admin_city?: string;
    admin_email: string;
  }) => {
    if (!user) return { data: null, error: 'Utilisateur non connecté' };

    try {
      const { data, error } = await supabase
        .from('organization_requests')
        .insert({
          ...requestData,
          created_by: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating organization request:', error);
        return { data: null, error: error.message };
      }

      await fetchRequests();
      return { data, error: null };
    } catch (err) {
      console.error('Unexpected error:', err);
      return { data: null, error: 'Une erreur inattendue est survenue' };
    }
  };

  /**
   * Approuver une demande et créer l'organisation
   * (Réservé à l'admin)
   */
  const approveRequest = async (requestId: string) => {
    if (!user) return { data: null, error: 'Utilisateur non connecté' };

    try {
      // 1. Récupérer les détails de la demande
      const { data: request, error: fetchError } = await supabase
        .from('organization_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        return { data: null, error: 'Demande introuvable' };
      }

      // 2. Créer l'organisation
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: request.organization_name,
          description: request.organization_description,
          website: request.organization_website,
          type: request.organization_type,
          created_by: request.created_by,
          validation_status: 'approved',
          validated_at: new Date().toISOString(),
          validated_by: user.id,
        })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        return { data: null, error: orgError.message };
      }

      // 3. Ajouter le créateur comme membre admin
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organization.id,
          user_id: request.created_by,
          status: 'active',
          role: 'admin',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        });

      if (memberError) {
        console.error('Error adding admin member:', memberError);
        // Continue même si l'ajout du membre échoue
      }

      // 4. Mettre à jour le profil de l'admin de l'organisation
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: request.admin_full_name,
          date_of_birth: request.admin_date_of_birth,
          phone: request.admin_phone,
          country: request.admin_country,
          city: request.admin_city,
          email: request.admin_email,
          role: request.organization_type,
          subscription: 'basic',
        })
        .eq('user_id', request.created_by);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Continue même si la mise à jour du profil échoue
      }

      // 5. Mettre à jour la demande comme approuvée
      const { error: updateError } = await supabase
        .from('organization_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          created_organization_id: organization.id,
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request:', updateError);
        return { data: null, error: updateError.message };
      }

      await fetchRequests();
      return { data: organization, error: null };
    } catch (err) {
      console.error('Unexpected error:', err);
      return { data: null, error: 'Une erreur inattendue est survenue' };
    }
  };

  /**
   * Rejeter une demande
   * (Réservé à l'admin)
   */
  const rejectRequest = async (requestId: string, reason?: string) => {
    if (!user) return { error: 'Utilisateur non connecté' };

    try {
      const { error } = await supabase
        .from('organization_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          rejection_reason: reason || null,
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting request:', error);
        return { error: error.message };
      }

      await fetchRequests();
      return { error: null };
    } catch (err) {
      console.error('Unexpected error:', err);
      return { error: 'Une erreur inattendue est survenue' };
    }
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const approvedRequests = requests.filter((r) => r.status === 'approved');
  const rejectedRequests = requests.filter((r) => r.status === 'rejected');

  return {
    requests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    loading,
    error,
    createRequest,
    approveRequest,
    rejectRequest,
    refetch: fetchRequests,
  };
};
