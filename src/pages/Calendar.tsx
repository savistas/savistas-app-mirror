import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { 
  User, 
  Power, 
  Menu, 
  Bot,
  Zap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useDisplayName } from "@/hooks/use-display-name";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const displayName = useDisplayName();
  
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
  
  const today = new Date();
  
  const renderCalendarDay = (day: number) => {
    const isToday =
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear();
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
          <span className="font-medium text-foreground">{displayName || 'Mon profil'}</span>
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
          <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            <span className="font-medium text-foreground min-w-[140px] text-center">
              {currentMonth} {currentYear}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>
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

      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Calendar;