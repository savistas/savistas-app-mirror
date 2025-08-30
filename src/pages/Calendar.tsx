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
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDisplayName } from "@/hooks/use-display-name";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Exercise {
  id: string;
  statut: string | null;
  date_exercice: string;
  exercice_title: string;
  course_id: string; // Ajout de course_id
  course_title: string; // Ajout de course_title
}

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const displayName = useDisplayName();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Get current month and year
  const currentMonth = currentDate.toLocaleDateString('fr-FR', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  
  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentYear, currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();
  
  // Fetch exercises for the current month
  useEffect(() => {
    const fetchExercises = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Utiliser une approche plus large pour capturer tous les exercices du mois
        const startOfMonth = new Date(currentYear, currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentYear, currentDate.getMonth() + 1, 0);
        
        // Ajouter un jour de marge pour éviter les problèmes de timezone
        const startDate = new Date(startOfMonth);
        startDate.setDate(startDate.getDate() - 1);
        const endDate = new Date(endOfMonth);
        endDate.setDate(endDate.getDate() + 1);
        
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        console.log('Fetching exercises from', startDateStr, 'to', endDateStr);
        console.log('Current month:', currentDate.getMonth(), 'year:', currentYear);
        
        const { data, error } = await supabase
          .from('exercises')
          .select('id, statut, date_exercice, exercice_title, course_id, courses(title)') // Sélectionner course_id et le titre du cours
          .eq('user_id', user.id)
          .gte('date_exercice', startDateStr)
          .lte('date_exercice', endDateStr);
        
        if (error) {
          console.error('Error fetching exercises:', error);
        } else {
          console.log('Fetched exercises:', data);
          // Mapper les données pour extraire le titre du cours
          const mappedData = data.map((item: any) => ({
            ...item,
            course_title: item.courses ? item.courses.title : 'N/A' // Extraire le titre du cours
          }));
          setExercises(mappedData || []);
        }
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExercises();
  }, [user, currentDate]);
  
  // Create QCM days object from exercises data
  const qcmDays: { [key: number]: { hasCompleted: boolean; hasPending: boolean; hasQCM: boolean } } = {};
  exercises.forEach(exercise => {
    // Parse date more carefully to handle timezone issues
    const exerciseDate = new Date(exercise.date_exercice + 'T00:00:00');
    console.log('Processing exercise:', exercise.date_exercice, 'parsed as:', exerciseDate, 'day:', exerciseDate.getDate());
    
    if (exerciseDate.getMonth() === currentDate.getMonth() &&
        exerciseDate.getFullYear() === currentDate.getFullYear()) {
      const day = exerciseDate.getDate();
      
      if (!qcmDays[day]) {
        qcmDays[day] = { hasCompleted: false, hasPending: false, hasQCM: true };
      }
      
      if (exercise.statut === 'Terminé') {
        qcmDays[day].hasCompleted = true;
      } else {
        qcmDays[day].hasPending = true;
      }
    }
  });
  
  console.log('QCM days:', qcmDays);
  
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDayExercises, setSelectedDayExercises] = useState<Exercise[]>([]);

  const today = new Date();
  
  const renderCalendarDay = (day: number) => {
    const isToday =
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear();
    const dayData = qcmDays[day];
    
    const hasExercises = dayData?.hasCompleted || dayData?.hasPending;

        const handleDayClick = () => {
          if (hasExercises) {
            const exercisesForDay = exercises.filter(exercise => {
              const exerciseDate = new Date(exercise.date_exercice + 'T00:00:00');
              return exerciseDate.getDate() === day &&
                     exerciseDate.getMonth() === currentDate.getMonth() &&
                     exerciseDate.getFullYear() === currentDate.getFullYear();
            });
            setSelectedDayExercises(exercisesForDay);
            setHoveredDay(null); // Masquer la popover "Détails"
            setIsDetailsModalOpen(true);
          }
        };

    // Cas où il y a des QCM mixtes (terminés + à faire)
    if (dayData?.hasCompleted && dayData?.hasPending) {
      return (
        <Popover open={hoveredDay === day && hasExercises}>
          <PopoverTrigger asChild>
            <button
              key={day}
              className={`w-12 h-12 flex items-center justify-center text-sm rounded-lg transition-colors relative overflow-hidden ${
                isToday ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
              }`}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={handleDayClick}
            >
              {/* Dégradé diagonal vert vers bleu - plus progressif et fluide */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(135deg, #2a9d8f 0%, #2a9d8f 50%, #4b5563 50%, #4b5563 100%)'
              }}></div>
              <span className="relative z-10 text-white font-medium text-xs">{day}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-auto p-2 text-xs bg-white text-black rounded-md shadow-md border-none">
            Détails
          </PopoverContent>
        </Popover>
      );
    }
    
    let className = "w-12 h-12 flex items-center justify-center text-sm rounded-lg transition-colors ";
    
    if (dayData?.hasCompleted && !dayData?.hasPending) {
      // Vert pour les QCM tous terminés
      className += "bg-[#2a9d8f] text-white font-medium";
    } else if (dayData?.hasPending && !dayData?.hasCompleted) {
      // Bleu pour les QCM tous à faire
      className += "bg-gray-700 text-white font-medium";
    } else if (isToday) {
      className += "border-2 border-primary text-primary font-medium";
    } else {
      className += "text-muted-foreground hover:bg-muted";
    }
    
    // Ajouter le contour pour aujourd'hui même s'il y a des QCM
    if (isToday && hasExercises) {
      className += " ring-2 ring-yellow-400 ring-offset-1";
    }
    
    return (
      <Popover open={hoveredDay === day && hasExercises}>
        <PopoverTrigger asChild>
          <button 
            key={day} 
            className={className}
            onMouseEnter={() => setHoveredDay(day)}
            onMouseLeave={() => setHoveredDay(null)}
            onClick={handleDayClick}
          >
            {dayData?.hasQCM && dayData?.hasPending && !dayData?.hasCompleted ? (
              <span className="text-xs">QCM</span>
            ) : (
              day
            )}
          </button>
        </PopoverTrigger>
          <PopoverContent side="top" className="w-auto p-2 text-xs bg-white text-black rounded-md shadow-md border-none">
            Détails
          </PopoverContent>
      </Popover>
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
            <div className="w-4 h-4 bg-[#2a9d8f] rounded"></div>
            <span className="text-muted-foreground">Terminé</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-700 rounded"></div>
            <span className="text-muted-foreground">À faire</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{
              background: 'linear-gradient(135deg, #2a9d8f 0%, #2a9d8f 50%, #4b5563 50%, #4b5563 100%)'
            }}></div>
            <span className="text-muted-foreground">Mixte (terminé + à faire)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-yellow-400 rounded"></div>
            <span className="text-muted-foreground">Aujourd'hui</span>
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="text-center text-muted-foreground">
            <p>Chargement des exercices...</p>
          </div>
        )}

      </main>

      {/* Exercise Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="w-[90vw] sm:max-w-[425px] rounded-lg">
          <DialogHeader>
            <DialogTitle>Liste des exercices</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {selectedDayExercises.length > 0 ? (
              selectedDayExercises.map((exercise) => (
                <button 
                  key={exercise.id} 
                  className="flex items-center p-3 rounded-lg bg-gray-100 shadow-sm transition-all duration-200 hover:shadow-md w-full text-left"
                  onClick={() => {
                    setIsDetailsModalOpen(false); // Fermer la modale
                    if (exercise.statut === 'Terminé') {
                      navigate(`/result/${exercise.id}`);
                    } else {
                      navigate(`/daily-quiz/${exercise.id}`);
                    }
                  }}
                >
                  <div 
                    className={`w-4 h-4 rounded-full mr-3 ${
                      exercise.statut === 'Terminé' ? 'bg-[#2a9d8f]' : 'bg-gray-700'
                    }`}
                  ></div>
                  <div>
                    <p className="text-xs text-gray-600">{exercise.course_title}</p>
                    <span className="text-sm font-medium text-gray-800">{exercise.exercice_title}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-muted-foreground">Aucun exercice pour ce jour.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Calendar;
