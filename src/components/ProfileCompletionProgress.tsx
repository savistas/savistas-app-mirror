interface ProfileCompletionProgressProps {
  completionPercentage: number;
  missingFields: string[];
}

export const ProfileCompletionProgress = ({ 
  completionPercentage, 
  missingFields 
}: ProfileCompletionProgressProps) => {
  const getMessage = (percentage: number) => {
    if (percentage <= 30) return "🌱 Commençons par les bases...";
    if (percentage <= 60) return "📚 Vous progressez bien !";
    if (percentage <= 90) return "🚀 Presque terminé !";
    if (percentage < 100) return "✨ Plus qu'un petit effort !";
    return "🎉 Profil complet ! Bienvenue dans votre espace d'apprentissage !";
  };

  return (
    <div className="mb-6 p-4 bg-card rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">
          Progression du profil
        </span>
        <span className="text-sm text-muted-foreground">
          {completionPercentage}%
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2 mb-3">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      
      <div className="text-sm text-primary font-medium mb-2">
        {getMessage(completionPercentage)}
      </div>
      
      {missingFields.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Champs manquants: {missingFields.join(', ')}
        </div>
      )}
    </div>
  );
};