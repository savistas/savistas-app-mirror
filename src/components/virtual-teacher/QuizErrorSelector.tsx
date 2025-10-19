import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AlertCircle, Search, Loader2, XCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { QuizContext, QuizError } from '@/services/agentConfigService';

export interface QuizErrorSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectQuiz: (quiz: QuizContext) => void;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  quiz_title: string;
  score: number;
  total_questions: number;
  answers: any[];
  created_at: string;
}

/**
 * Sélecteur de quiz avec erreurs pour le mode "Comprendre mes erreurs"
 */
export function QuizErrorSelector({
  open,
  onOpenChange,
  onSelectQuiz,
}: QuizErrorSelectorProps) {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [filteredAttempts, setFilteredAttempts] = useState<QuizAttempt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Charger les tentatives de quiz avec erreurs
   */
  useEffect(() => {
    if (open && user) {
      loadQuizAttempts();
    }
  }, [open, user]);

  const loadQuizAttempts = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_quiz_attempts')
        .select(`
          id,
          quiz_id,
          score,
          answers,
          created_at,
          quizzes:quiz_id (
            title,
            questions
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtrer uniquement les tentatives avec des erreurs
      const attemptsWithErrors = (data || [])
        .filter((attempt: any) => {
          const totalQuestions = attempt.quizzes?.questions?.length || 0;
          return attempt.score < totalQuestions; // Au moins une erreur
        })
        .map((attempt: any) => ({
          id: attempt.id,
          quiz_id: attempt.quiz_id,
          quiz_title: attempt.quizzes?.title || 'Sans titre',
          score: attempt.score,
          total_questions: attempt.quizzes?.questions?.length || 0,
          answers: attempt.answers || [],
          created_at: attempt.created_at,
        }));

      setAttempts(attemptsWithErrors);
      setFilteredAttempts(attemptsWithErrors);
    } catch (error) {
      console.error('Erreur chargement quiz:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Filtrer selon la recherche
   */
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAttempts(attempts);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredAttempts(
        attempts.filter((attempt) =>
          attempt.quiz_title.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, attempts]);

  const handleSelectQuiz = async (attempt: QuizAttempt) => {
    try {
      // Récupérer les détails du quiz pour construire les erreurs
      const { data: quizData, error } = await supabase
        .from('quizzes')
        .select('questions')
        .eq('id', attempt.quiz_id)
        .single();

      if (error) throw error;

      const questions = quizData.questions || [];
      const errors: QuizError[] = [];

      // Identifier les erreurs
      questions.forEach((question: any, index: number) => {
        const userAnswer = attempt.answers[index];
        const correctAnswer = question.correct_answer || question.correctAnswer;

        if (userAnswer !== correctAnswer) {
          errors.push({
            question: question.question,
            user_answer: userAnswer || 'Pas de réponse',
            correct_answer: correctAnswer,
            explanation: question.explanation,
          });
        }
      });

      onSelectQuiz({
        quiz_id: attempt.quiz_id,
        quiz_title: attempt.quiz_title,
        errors,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erreur sélection quiz:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Sélectionnez un quiz</DialogTitle>
          <DialogDescription>
            Choisissez le quiz dont vous souhaitez comprendre les erreurs
          </DialogDescription>
        </DialogHeader>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un quiz..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste des quiz */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {searchQuery
                ? 'Aucun quiz trouvé'
                : 'Vous n\'avez pas encore de quiz avec des erreurs'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredAttempts.map((attempt) => (
                <QuizCard
                  key={attempt.id}
                  attempt={attempt}
                  onSelect={() => handleSelectQuiz(attempt)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Carte de quiz individuelle
 */
function QuizCard({
  attempt,
  onSelect,
}: {
  attempt: QuizAttempt;
  onSelect: () => void;
}) {
  const errorCount = attempt.total_questions - attempt.score;
  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base">{attempt.quiz_title}</CardTitle>
            <CardDescription className="mt-1">
              {new Date(attempt.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </CardDescription>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">{attempt.score} bonnes</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm">{errorCount} erreurs</span>
          </div>
          <Badge
            variant={percentage >= 80 ? 'default' : percentage >= 50 ? 'secondary' : 'destructive'}
          >
            {percentage}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Button size="sm" variant="outline" className="w-full">
          Comprendre mes erreurs ({errorCount})
        </Button>
      </CardContent>
    </Card>
  );
}
