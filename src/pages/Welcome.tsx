import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Welcome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-8">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">Savistas</h1>
        </div>

        {/* Main Content */}
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Rejoindre la bêta
          </h2>
          
          <p className="text-muted-foreground">
            Savistas est actuellement en bêta. Vous aurez donc accès aux fonctionnalités premium.
          </p>

          <div className="space-y-4">
            <Link to="/register">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-medium rounded-xl"
              >
                Commencer maintenant
              </Button>
            </Link>
            
            <div className="pt-4">
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-6 text-lg font-medium rounded-xl border-2"
                onClick={() => navigate(user ? "/dashboard" : "/auth")}
              >
                Se connecter
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-6">
            Les places sont limitées, rejoignez la liste d'attente dès maintenant !
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;