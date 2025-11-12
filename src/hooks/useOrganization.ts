import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Organization {
  id: string;
  name: string;
  description: string | null;
  organization_code: string;
  created_at: string;
  type: 'school' | 'company';
  max_members: number;
  validation_status: 'pending' | 'approved' | 'rejected';
  website: string | null;
  validated_at: string | null;
  validated_by: string | null;
  // B2B seat-based billing fields
  active_members_count: number;
  seat_limit: number | null;
}

export const useOrganization = () => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrganization = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('created_by', user.id)
      .single();

    if (data) {
      setOrganization(data as Organization);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchOrganization();
  }, [user]);

  const createOrganization = async (
    name: string,
    description: string,
    type: 'school' | 'company'
  ) => {
    if (!user) return { data: null, error: 'No user' };

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        description,
        type,
        created_by: user.id,
      })
      .select()
      .single();

    if (data) {
      setOrganization(data as Organization);
    }

    return { data, error };
  };

  const regenerateCode = async () => {
    if (!user || !organization) return { data: null, error: 'No organization' };

    // Appeler la fonction generate_organization_code
    const { data: newCode, error: codeError } = await supabase.rpc(
      'generate_organization_code'
    );

    if (codeError || !newCode) {
      return { data: null, error: codeError };
    }

    // Mettre à jour l'organisation avec le nouveau code
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ organization_code: newCode })
      .eq('id', organization.id);

    if (!updateError) {
      setOrganization({ ...organization, organization_code: newCode });
      return { data: newCode, error: null };
    }

    return { data: null, error: updateError };
  };

  const updateOrganization = async (updates: {
    name?: string;
    description?: string;
  }) => {
    if (!user || !organization) return { error: 'No organization' };

    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organization.id);

    if (!error) {
      setOrganization({ ...organization, ...updates });
    }

    return { error };
  };

  return {
    organization,
    loading,
    createOrganization,
    regenerateCode,
    updateOrganization,
    refetch: fetchOrganization,
  };
};
