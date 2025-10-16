import { Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface QuizTimerProps {
  formattedTime: string;
  isRunning: boolean;
  showQuestionTime?: boolean;
  formattedQuestionTime?: string;
}

/**
 * Displays the quiz timer
 * Shows total elapsed time and optionally per-question time
 */
export const QuizTimer = ({
  formattedTime,
  isRunning,
  showQuestionTime = false,
  formattedQuestionTime
}: QuizTimerProps) => {
  return (
    <Card className="border-border bg-muted/50">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock
              className={`w-5 h-5 ${isRunning ? 'text-primary animate-pulse' : 'text-muted-foreground'}`}
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                Temps total: {formattedTime}
              </span>
              {showQuestionTime && formattedQuestionTime && (
                <span className="text-xs text-muted-foreground">
                  Question actuelle: {formattedQuestionTime}
                </span>
              )}
            </div>
          </div>
          {isRunning && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-muted-foreground">En cours</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
