import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { useGenerateQuiz } from '@/hooks/revision-sheets/useGenerateQuiz';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { LimitReachedDialog } from '@/components/subscription/LimitReachedDialog';

interface QuizGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
}

export function QuizGenerationDialog({
  open,
  onOpenChange,
  courseId,
}: QuizGenerationDialogProps) {
  const generateQuizMutation = useGenerateQuiz();
  const { subscription } = useSubscription();
  const { canCreate, getLimitInfo } = useUsageLimits();
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'facile' | 'moyen' | 'difficile'>('moyen');
  const [showLimitDialog, setShowLimitDialog] = useState(false);

  const handleGenerate = async () => {
    // Check subscription limits before creating exercise/quiz
    if (!canCreate('exercise')) {
      setShowLimitDialog(true);
      return;
    }

    await generateQuizMutation.mutateAsync({
      courseId,
      options: {
        questionCount,
        difficulty,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Créer un Quiz depuis cette fiche</DialogTitle>
          <DialogDescription>
            Configurez votre quiz personnalisé basé sur le contenu de la fiche de révision
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Question Count */}
          <div className="space-y-3">
            <Label>Nombre de questions : {questionCount}</Label>
            <Slider
              value={[questionCount]}
              onValueChange={([value]) => setQuestionCount(value)}
              min={5}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5</span>
              <span>20</span>
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-3">
            <Label>Difficulté</Label>
            <RadioGroup
              value={difficulty}
              onValueChange={(value) => setDifficulty(value as 'facile' | 'moyen' | 'difficile')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="facile" id="facile" />
                <Label htmlFor="facile" className="font-normal cursor-pointer">
                  Facile
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="moyen" id="moyen" />
                <Label htmlFor="moyen" className="font-normal cursor-pointer">
                  Moyen
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="difficile" id="difficile" />
                <Label htmlFor="difficile" className="font-normal cursor-pointer">
                  Difficile
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleGenerate} disabled={generateQuizMutation.isPending}>
            {generateQuizMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {generateQuizMutation.isPending ? 'Génération du quiz...' : 'Générer le Quiz'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Limit Reached Dialog */}
      <LimitReachedDialog
        open={showLimitDialog}
        onClose={() => setShowLimitDialog(false)}
        resourceType="exercise"
        currentPlan={subscription?.plan || 'basic'}
        current={getLimitInfo('exercise').current}
        limit={getLimitInfo('exercise').limit}
      />
    </Dialog>
  );
}
