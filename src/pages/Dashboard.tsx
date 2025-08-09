import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  User, 
  Menu, 
  Home, 
  Calendar, 
  MessageCircle,
  BookOpen,
  Calculator,
  Atom
} from "lucide-react";
import { Link } from "react-router-dom";

// Mock data for courses
const courses = [
  {
    id: 1,
    title: "Mathématiques",
    subject: "Fonctions affines",
    level: "Première",
    currentDay: 5,
    totalDays: 15,
    status: "En cours",
    icon: Calculator,
    progress: 33
  },
  {
    id: 2,
    title: "Physique",
    subject: "Mécanique",
    level: "Première", 
    currentDay: 12,
    totalDays: 12,
    status: "Terminé",
    icon: Atom,
    progress: 100
  }
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <User className="w-8 h-8 text-primary" strokeWidth={1.5} />
          <span className="font-medium text-foreground">Sarah Martin</span>
        </div>
        <Button variant="ghost" size="sm">
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </Button>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6 animate-fade-in">
        {/* My Courses Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Mes cours</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Card key={course.id} className="border-border hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <course.icon className="w-6 h-6 text-primary" strokeWidth={1.5} />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{course.title}</h3>
                        <p className="text-sm text-muted-foreground">{course.subject} • {course.level}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Jour {course.currentDay}/{course.totalDays}
                          </span>
                          <span className={`font-medium ${
                            course.status === "Terminé" ? "text-success" : "text-primary"
                          }`}>
                            {course.status}
                          </span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Add Course FAB */}
        <div className="fixed bottom-20 right-6 md:bottom-8">
          <Button 
            asChild
            size="lg" 
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          >
            <Link to="/upload-course">
              <Plus className="w-6 h-6" strokeWidth={1.5} />
            </Link>
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden">
        <div className="flex items-center justify-around py-3">
          <Link to="/dashboard" className="flex flex-col items-center space-y-1">
            <Home className="w-5 h-5 text-primary" strokeWidth={1.5} />
            <span className="text-xs text-primary font-medium">Accueil</span>
          </Link>
          <Link to="/calendar" className="flex flex-col items-center space-y-1">
            <Calendar className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">Agenda</span>
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

export default Dashboard;