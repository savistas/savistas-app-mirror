import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { 
  User, 
  Power, 
  Menu, 
  Calculator,
  Bot,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Planning = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get current month and year
  const currentMonth = currentDate.toLocaleDateString('fr-FR', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentYear, currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();
  
  // Mock data for planned days (31 days total)
  const plannedDays = {
    1: { completed: true, score: "18/20" },
    3: { completed: true, score: "16/20" },
    5: { completed: true, score: "19/20" },
    7: { completed: true, score: "17/20" },
    9: { completed: true, score: "20/20" },
    11: { completed: false, hasQCM: true }, // Today
    13: { completed: false, hasQCM: true },
    15: { completed: false, hasQCM: true },
    17: { completed: false, hasQCM: true },
    19: { completed: false, hasQCM: true },
    21: { completed: false, hasQCM: true },
    23: { completed: false, hasQCM: true },
    25: { completed: false, hasQCM: true },
    27: { completed: false, hasQCM: true },
    29: { completed: false, hasQCM: true },
    31: { completed: false, hasQCM: true }
  };
  
  const today = 11; // Mock today as day 11
  
  const renderCalendarDay = (day: number) => {
    const isToday = day === today;
    const dayData = plannedDays[day];
    
    let className = "w-12 h-12 flex items-center justify-center text-sm rounded-lg transition-colors ";
    
    if (dayData?.completed) {
      className += "bg-success text-success-foreground font-medium";
    } else if (dayData?.hasQCM) {
      className += "bg-primary text-primary-foreground font-medium";
    } else if (isToday) {
      className += "border-2 border-primary text-primary font-medium";
    } else {
      className += "text-muted-foreground hover:bg-muted";
    }
    
    return (
      <button key={day} className={className}>
        {dayData?.hasQCM && !dayData?.completed ? (
          <span className="text-xs">QCM</span>
        ) : (
          day
        )}
      </button>
    );
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
      <main className="p-6 space-y-6 animate-fade-in pb-24">
        {/* Title and Month */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Planning</h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            <span className="font-medium text-foreground min-w-[140px] text-center">
              {currentMonth} {currentYear}
            </span>
            <Button variant="ghost" size="sm">
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        {/* Course Card */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calculator className="w-6 h-6 text-primary" strokeWidth={1.5} />
              </div>
              
              <div className="flex-1 space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Mathématiques</h3>
                <p className="text-muted-foreground">Niveau Première</p>
                <p className="text-muted-foreground">Leçon Fonctions affines</p>
                <p className="text-muted-foreground">Durée 31 jours</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-primary" strokeWidth={1.5} />
                <span className="text-sm text-primary font-medium">AI Assistant</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <div className="space-y-4">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2">
            {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: startDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="w-12 h-12"></div>
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => renderCalendarDay(i + 1))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-success rounded"></div>
            <span className="text-muted-foreground">Terminé</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary rounded"></div>
            <span className="text-muted-foreground">QCM planifié</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary rounded"></div>
            <span className="text-muted-foreground">Aujourd'hui</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-4">
          <Button 
            asChild
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6"
          >
            <Link to="/daily-quiz">C'est parti !</Link>
          </Button>
        </div>

      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Planning;