import { Button } from "@/components/ui/button";
import { 
  User, 
  Power, 
  Menu, 
  Home, 
  Calendar as CalendarIcon, 
  MessageCircle,
  Bot,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get current month and year
  const currentMonth = currentDate.toLocaleDateString('fr-FR', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentYear, currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();
  
  // Mock data for QCM days
  const qcmDays = {
    5: { completed: true, score: "18/20" },
    8: { completed: true, score: "16/20" },
    12: { completed: true, score: "19/20" },
    15: { completed: false, hasQCM: true },
    18: { completed: false, hasQCM: true },
    22: { completed: false, hasQCM: true }
  };
  
  const today = new Date().getDate();
  
  const renderCalendarDay = (day: number) => {
    const isToday = day === today;
    const dayData = qcmDays[day];
    
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
      <main className="p-6 space-y-6 animate-fade-in">
        {/* Title and Month */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
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
            <span className="text-muted-foreground">QCM disponible</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-primary rounded"></div>
            <span className="text-muted-foreground">Aujourd'hui</span>
          </div>
        </div>

        {/* AI Assistant FAB */}
        <div className="fixed bottom-20 right-6 md:bottom-8">
          <Button 
            asChild
            size="lg" 
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          >
            <Link to="/messaging">
              <div className="relative">
                <Bot className="w-6 h-6" strokeWidth={1.5} />
                <Zap className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400" strokeWidth={2} />
              </div>
            </Link>
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden">
        <div className="flex items-center justify-around py-3">
          <Link to="/dashboard" className="flex flex-col items-center space-y-1">
            <Home className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">Accueil</span>
          </Link>
          <Link to="/calendar" className="flex flex-col items-center space-y-1">
            <CalendarIcon className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="text-xs text-primary font-medium">Agenda</span>
          </Link>
          <Link to="/messaging" className="flex flex-col items-center space-y-1">
            <MessageCircle className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">Messages</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Calendar;