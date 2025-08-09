import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  User, 
  Power, 
  Menu,
  TrendingUp,
  FileText,
  Trash2
} from "lucide-react";
import { Link } from "react-router-dom";

const Result = () => {
  const result = {
    chapter: "Fonctions affines - Définitions de base",
    questionsCount: 20,
    score: 19,
    total: 20,
    percentage: 95
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <User className="w-8 h-8 text-primary" strokeWidth={1.5} />
          <span className="font-medium text-foreground">Sarah Martin</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Power className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="sm">
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6 animate-fade-in">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Result Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Résultat
            </h1>
            <p className="text-muted-foreground">
              {result.chapter}
            </p>
            <p className="text-sm text-muted-foreground">
              {result.questionsCount} questions
            </p>
          </div>

          {/* Score Display */}
          <Card className="border-border">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-primary">
                  {result.score}/{result.total}
                </div>
                <div className="text-xl text-success font-medium">
                  Excellent travail !
                </div>
                <div className="text-muted-foreground">
                  Vous avez obtenu {result.percentage}% de bonnes réponses
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full border-border hover:bg-muted"
            >
              <TrendingUp className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Voir mes résultats
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full border-border hover:bg-muted"
            >
              <FileText className="w-4 h-4 mr-2" strokeWidth={1.5} />
              PDF
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full border-border hover:bg-muted text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Supprimer
            </Button>
          </div>

          {/* Progress Chart Placeholder */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg text-center">
                Graphique évolutif
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-muted/50 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-2">
                  <TrendingUp className="w-8 h-8 text-primary mx-auto" strokeWidth={1.5} />
                  <p className="text-sm text-muted-foreground">
                    Évolution de vos performances
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main CTA */}
          <Button 
            asChild
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6"
          >
            <Link to="/calendar">Voir ma progression</Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Result;