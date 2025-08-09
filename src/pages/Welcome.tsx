import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Welcome = () => {
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
            <Link 
              to="/beta-code" 
              className="text-primary hover:underline font-medium"
            >
              Saisir le code bêta
            </Link>

            <div className="flex items-center space-x-4">
              <div className="flex-1 border-t border-border"></div>
              <span className="text-muted-foreground text-sm">OU</span>
              <div className="flex-1 border-t border-border"></div>
            </div>

            <Button 
              asChild 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6"
            >
              <Link to="/role-selection">Créer un compte</Link>
            </Button>
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