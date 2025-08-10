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
const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string>("");

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

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="relative flex items-center justify-center py-4 px-6">
        <div className="flex items-center justify-between w-full max-w-md">
          {/* Left side - Accueil & Agenda */}
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="flex flex-col items-center space-y-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isActive('/dashboard') ? 'bg-primary' : ''
              }`}>
                <Home className={`w-5 h-5 ${
                  isActive('/dashboard') ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} strokeWidth={1.5} />
              </div>
            </Link>
            
            <Link to="/calendar" className="flex flex-col items-center space-y-1">
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
            <Link to="/messaging" className="flex flex-col items-center space-y-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isActive('/messaging') ? 'bg-primary' : ''
              }`}>
                <MessageCircle className={`w-5 h-5 ${
                  isActive('/messaging') ? 'text-primary-foreground' : 'text-muted-foreground'
                }`} strokeWidth={1.5} />
              </div>
            </Link>
            
            <Link to="/profile" className="flex flex-col items-center space-y-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isActive('/profile') ? 'bg-primary/10 ring-2 ring-primary' : ''
              }`}>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={avatarUrl ?? undefined} alt={fullName || 'Avatar'} />
                  <AvatarFallback>{(fullName || 'P').slice(0,1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </Link>
          </div>
        </div>

        {/* Center - Add Button (positioned to overlap border) */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <Link 
            to="/upload-course" 
            className="flex flex-col items-center"
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