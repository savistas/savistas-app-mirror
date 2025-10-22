import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

const ALLOWED_ROUTES_WHEN_INCOMPLETE = [
  '/auth',
  '/profile',
  '/terms',
  '/privacy',
  '/reset-password',
  '/informations'
];

export const ProfileCompletionGuard = ({ children }: ProfileCompletionGuardProps) => {
  const { isProfileComplete, loading } = useProfileCompletion();
  const { role, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (loading || roleLoading) return;

    // Si pas connecté, laisser passer
    if (isProfileComplete === null) return;

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
  }, [isProfileComplete, loading, roleLoading, role, location.pathname, navigate, toast]);

  return <>{children}</>;
};