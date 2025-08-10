import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { 
  User, 
  Power, 
  Menu,
  TrendingUp,
  FileText,
  Trash2
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Course {
  id: string;
  title: string;
  subject: string | null;
  level: string | null;
  file_url: string | null;
}

interface Resp {
  created_at: string;
  is_correct: boolean | null;
  score: number | null;
}


const Result = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [responses, setResponses] = useState<Resp[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!courseId || !user) return;
      const { data } = await supabase
        .from('courses')
        .select('id,title,subject,level,file_url')
        .eq('id', courseId)
        .eq('user_id', user.id)
        .maybeSingle();
      setCourse((data as Course) || null);
    };
    load();
  }, [courseId, user]);

  useEffect(() => {
    const load = async () => {
      if (!courseId || !user) return;
      const { data } = await supabase
        .from('exercise_responses')
        .select('created_at,is_correct,score')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      setResponses((data as Resp[]) || []);
    };
    load();
  }, [courseId, user]);

  const correctCount = useMemo(() => responses.filter(r => r.is_correct).length, [responses]);
  const totalCount = responses.length;
  const percentage = totalCount ? Math.round((correctCount / totalCount) * 100) : 0;

  const chartData = useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>();
    for (const r of responses) {
      const d = new Date(r.created_at);
      const key = d.toLocaleDateString('fr-FR');
      const prev = map.get(key) || { total: 0, correct: 0 };
      prev.total += 1;
      prev.correct += r.is_correct ? 1 : 0;
      map.set(key, prev);
    }
    return Array.from(map.entries()).map(([date, v]) => ({ date, pct: Math.round((v.correct / v.total) * 100) }));
  }, [responses]);
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <User className="w-8 h-8 text-primary" strokeWidth={1.5} />
          <span className="font-medium text-foreground">{user?.email || 'Mon profil'}</span>
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
        <div className="max-w-lg mx-auto space-y-6">
          {/* Result Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {course?.title || "Résultat"}
            </h1>
            <p className="text-muted-foreground">
              {course?.subject || "—"} {course?.level ? `• ${course.level}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">
              {totalCount} réponses
            </p>
          </div>

          {/* Score Display */}
          <Card className="border-border">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-primary">
                  {correctCount}/{totalCount}
                </div>
                <div className="text-xl text-success font-medium">
                  {totalCount ? (percentage >= 80 ? "Excellent travail !" : percentage >= 50 ? "Bon début" : "Continuez") : "Aucune réponse pour le moment"}
                </div>
                <div className="text-muted-foreground">
                  {totalCount ? `Vous avez obtenu ${percentage}% de bonnes réponses` : "Répondez aux exercices pour voir vos résultats"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full border-border hover:bg-muted"
            >
              <TrendingUp className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Voir mes résultats
            </Button>
            
            {course?.file_url ? (
              <Button asChild variant="outline" className="w-full border-border hover:bg-muted">
                <a href={course.file_url} target="_blank" rel="noopener noreferrer">
                  <FileText className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Ouvrir le fichier
                </a>
              </Button>
            ) : (
              <Button variant="outline" disabled className="w-full border-border">Aucun fichier</Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full border-border hover:bg-muted text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Supprimer
            </Button>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg text-center">
                Graphique évolutif
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(val: any) => [`${val}%`, 'Taux de réussite']} />
                      <Line type="monotone" dataKey="pct" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-32 bg-muted/50 rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <TrendingUp className="w-8 h-8 text-primary mx-auto" strokeWidth={1.5} />
                    <p className="text-sm text-muted-foreground">
                      Aucune donnée pour le moment
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main CTA */}
          <Button 
            asChild
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6"
          >
            <Link to="/calendar">Voir ma progression</Link>
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Result;