import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Search, Loader2 } from 'lucide-react';
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
import type { CourseContext } from '@/services/agentConfigService';

export interface CourseSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectCourse: (course: CourseContext) => void;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  category: string | null;
  created_at: string;
}

/**
 * Sélecteur de cours pour le mode "Aide sur un cours"
 */
export function CourseSelector({
  open,
  onOpenChange,
  onSelectCourse,
}: CourseSelectorProps) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Charger les cours de l'utilisateur
   */
  useEffect(() => {
    if (open && user) {
      loadCourses();
    }
  }, [open, user]);

  const loadCourses = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, content, category, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCourses(data || []);
      setFilteredCourses(data || []);
    } catch (error) {
      console.error('Erreur chargement cours:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Filtrer les cours selon la recherche
   */
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCourses(
        courses.filter(
          (course) =>
            course.title.toLowerCase().includes(query) ||
            course.description?.toLowerCase().includes(query) ||
            course.category?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, courses]);

  const handleSelectCourse = (course: Course) => {
    onSelectCourse({
      course_id: course.id,
      title: course.title,
      description: course.description || undefined,
      content: course.content || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Sélectionnez un cours</DialogTitle>
          <DialogDescription>
            Choisissez le cours sur lequel vous souhaitez obtenir de l'aide
          </DialogDescription>
        </DialogHeader>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un cours..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Liste des cours */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {searchQuery
                ? 'Aucun cours trouvé'
                : 'Vous n\'avez pas encore de cours'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onSelect={() => handleSelectCourse(course)}
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
 * Carte de cours individuelle
 */
function CourseCard({
  course,
  onSelect,
}: {
  course: Course;
  onSelect: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-base">{course.title}</CardTitle>
            {course.description && (
              <CardDescription className="mt-1 line-clamp-2">
                {course.description}
              </CardDescription>
            )}
          </div>
          {course.category && (
            <Badge variant="secondary" className="shrink-0">
              {course.category}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Button size="sm" variant="outline" className="w-full">
          Sélectionner ce cours
        </Button>
      </CardContent>
    </Card>
  );
}
