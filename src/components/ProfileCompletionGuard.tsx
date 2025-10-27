import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

const ALLOWED_ROUTES_WHEN_INCOMPLETE = [
  '/auth',
  '/profile',
  '/creation-request', // Permet aux organisations avec demande pending d'accéder à cette page
  '/terms',
  '/privacy',
  '/reset-password',
  '/informations'
];

export const ProfileCompletionGuard = ({ children }: ProfileCompletionGuardProps) => {
  const { isProfileComplete, loading } = useProfileCompletion();
  const { role, loading: roleLoading } = useUserRole();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasPendingMembership, setHasPendingMembership] = useState<boolean>(false);
  const [membershipLoading, setMembershipLoading] = useState<boolean>(true);

  // Vérifier si l'utilisateur a une adhésion en attente
  useEffect(() => {
    const checkPendingMembership = async () => {
      if (!user || role !== 'student') {
        setMembershipLoading(false);
        return;
      }

      const { data: membership } = await supabase
        .from('organization_members')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      setHasPendingMembership(!!membership);
      setMembershipLoading(false);
    };

    checkPendingMembership();
  }, [user, role]);

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (loading || roleLoading || membershipLoading) return;

    // Si pas connecté, laisser passer
    if (isProfileComplete === null) return;

    // Si adhésion en attente, bloquer toutes les pages sauf /profile
    if (hasPendingMembership) {
      const isAllowedRoute = ALLOWED_ROUTES_WHEN_INCOMPLETE.some(route =>
        location.pathname.startsWith(route) ||
        location.pathname.match(new RegExp(`^/[^/]+${route}$`))
      );

      if (!isAllowedRoute) {
        toast({
          title: "Demande en attente",
          description: "Votre organisation doit approuver votre demande avant que vous puissiez accéder aux autres pages.",
          variant: "destructive",
          duration: 5000,
        });
        navigate('/profile');
        return;
      }
    }

    // Si profil incomplet et pas sur une route autorisée
    const isAllowedRoute = ALLOWED_ROUTES_WHEN_INCOMPLETE.some(route =>
      location.pathname.startsWith(route) ||
      location.pathname.match(new RegExp(`^/[^/]+${route}$`)) // Match /:role/profile, etc.
    );

    if (!isProfileComplete && !isAllowedRoute && role) {
      toast({
        title: "Profil incomplet",
        description: "Veuillez compléter votre profil pour accéder à cette page.",
        variant: "destructive",
        duration: 5000,
      });
      navigate(`/${role}/profile`);
    }
  }, [isProfileComplete, loading, roleLoading, membershipLoading, hasPendingMembership, role, location.pathname, navigate, toast]);

  return <>{children}</>;
};