import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import BottomNav from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Power, 
  Menu,
  Bot,
  Zap
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const DailyQuiz = () => {
  const navigate = useNavigate();
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const totalQuestions = 20;
  
  // Mock question data
  const question = {
    title: "Partie 1 - Définitions de base",
    question: "Quelle est la forme générale d'une fonction affine ?",
    options: [
      "f(x) = ax + b",
      "f(x) = ax²",
      "f(x) = a/x + b",
      "f(x) = √(ax + b)"
    ]
  };

  const handleNext = () => {
    if (currentQuestion >= totalQuestions) {
      navigate("/result");
    } else {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer("");
    }
  };

  const progress = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <div className="w-full bg-muted h-1">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

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
      <main className="p-6 space-y-6 animate-fade-in pb-24">
        {/* Question Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-primary">
            {question.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestion} sur {totalQuestions}
          </p>
        </div>

        {/* Question Card */}
        <Card className="border-border">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-medium text-foreground leading-relaxed">
              {question.question}
            </h2>

            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-4">
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value={option} 
                      id={`option-${index}`}
                      className="border-border data-[state=checked]:border-primary data-[state=checked]:text-primary"
                    />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 text-foreground cursor-pointer py-2"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="pt-4">
          <Button 
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6 disabled:opacity-50"
          >
            {currentQuestion >= totalQuestions ? "Terminer" : "Suivant"}
          </Button>
        </div>

      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default DailyQuiz;