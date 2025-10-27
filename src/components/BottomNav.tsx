import { 
  Home, 
  Calendar, 
  MessageCircle,
  Plus
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";

const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { isProfileComplete } = useProfileCompletion();
  const { toast } = useToast();
  const { role, loading: roleLoading } = useUserRole();

  const isActive = (path: string) => currentPath === path || currentPath === `/${role}${path}`;
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");

  // Helper pour générer les liens avec rôle
  const getRolePath = (path: string) => `/${role}${path}`;

  // Détermine le dashboard approprié selon le rôle
  const getDashboardPath = () => {
    if (role === 'student') {
      return getRolePath('/dashboard');
    }
    // Pour school, company, parent, professor -> dashboard-organization
    return getRolePath('/dashboard-organization');
  };

  const handleNavClick = (path: string, e: React.MouseEvent) => {
    if (!isProfileComplete && path !== '/profile') {
      e.preventDefault();
      toast({
        title: "Profil incomplet",
        description: "Complétez votre profil pour accéder à cette section.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) { setAvatarUrl(null); setFullName(""); return; }
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_photo_url, full_name, email')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setAvatarUrl(null);
        setFullName(user.email || "");
        return;
      }
      setAvatarUrl(data?.profile_photo_url ?? null);
      setFullName(data?.full_name || data?.email || user.email || "");
    };
    load();
    return () => { active = false; };
  }, [user?.id]);

  // Version simplifiée pour les organisations (school, company)
  const isOrganization = role === 'school' || role === 'company';

  if (isOrganization) {
    return (
      <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border transition-opacity duration-200 ${
        roleLoading ? 'opacity-0' : 'opacity-100'
      }`}>
        <div className="flex items-center justify-between py-4 px-6 max-w-md mx-auto">
          {/* Accueil */}
          <Link
            to={getDashboardPath()}
            className="flex flex-col items-center space-y-1"
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isActive('/dashboard-organization') ? 'bg-primary' : ''
            }`}>
              <Home className={`w-5 h-5 ${
                isActive('/dashboard-organization') ? 'text-primary-foreground' : 'text-muted-foreground'
              }`} strokeWidth={1.5} />
            </div>
          </Link>

          {/* Profil */}
          <Link to={getRolePath('/profile')} className="flex flex-col items-center space-y-1">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isActive('/profile') ? 'bg-sky-100 ring-2 ring-sky-500' : 'bg-gradient-to-br from-sky-400 to-sky-600'
            }`}>
              <Avatar className="w-9 h-9">
                <AvatarImage src={avatarUrl ?? undefined} alt={fullName || 'Avatar'} />
                <AvatarFallback className="bg-sky-500 text-white">{(fullName || 'P').slice(0,1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </Link>
        </div>
      </nav>
    );
  }

  // Version complète pour les étudiants
  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border transition-opacity duration-200 ${
      roleLoading ? 'opacity-0' : 'opacity-100'
    }`}>
      <div className="relative flex items-center justify-center py-4 px-6">
        <div className="flex items-center justify-between w-full max-w-md">
          {/* Left side - Accueil & Agenda */}
          <div className="flex items-center space-x-8">
            <Link
              to={getDashboardPath()}
              className={`flex flex-col items-center space-y-1 ${!isProfileComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => handleNavClick('/dashboard', e)}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isActive('/dashboard') || isActive('/dashboard-organization') ? 'bg-primary' : ''
              }`}>
                <Home className={`w-5 h-5 ${
                  isActive('/dashboard') || isActive('/dashboard-organization') ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} strokeWidth={1.5} />
              </div>
            </Link>

            <Link
              to={getRolePath('/calendar')}
              className={`flex flex-col items-center space-y-1 ${!isProfileComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => handleNavClick('/calendar', e)}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isActive('/calendar') ? 'bg-primary' : ''
              }`}>
                <Calendar className={`w-5 h-5 ${
                  isActive('/calendar') ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} strokeWidth={1.5} />
              </div>
            </Link>
          </div>

          {/* Right side - Chat & Profil */}
          <div className="flex items-center space-x-8">
            <Link
              to={getRolePath('/messaging')}
              className={`flex flex-col items-center space-y-1 ${!isProfileComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => handleNavClick('/messaging', e)}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isActive('/messaging') ? 'bg-primary' : ''
              }`}>
                <MessageCircle className={`w-5 h-5 ${
                  isActive('/messaging') ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} strokeWidth={1.5} />
              </div>
            </Link>

            <Link to={getRolePath('/profile')} className="flex flex-col items-center space-y-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isActive('/profile') ? 'bg-sky-100 ring-2 ring-sky-500' : 'bg-gradient-to-br from-sky-400 to-sky-600'
              }`}>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={avatarUrl ?? undefined} alt={fullName || 'Avatar'} />
                  <AvatarFallback className="bg-sky-500 text-white">{(fullName || 'P').slice(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </Link>
          </div>
        </div>

        {/* Center - Add Button (positioned to overlap border) */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Link
            to={getRolePath('/upload-course')}
            className={`flex flex-col items-center ${!isProfileComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={e => {
              if (!isProfileComplete) {
                e.preventDefault();
                toast({
                  title: "Profil incomplet",
                  description: "Complétez votre profil pour accéder à cette section.",
                  variant: "destructive",
                  duration: 3000,
                });
              }
            }}
          >
            <div className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 transition-colors flex items-center justify-center shadow-lg border-4 border-background">
              <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={1.5} />
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;