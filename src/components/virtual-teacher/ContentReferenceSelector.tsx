import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ConversationType, Course, Exercise, ErrorResponse } from './types';

interface ContentReferenceSelectorProps {
  conversationType: ConversationType;
  value?: string;
  onChange: (id: string) => void;
  courses?: Course[];
  exercises?: Exercise[];
  errors?: ErrorResponse[];
  isLoading?: boolean;
  error?: Error | null;
  disabled?: boolean;
  // Pour exercices : sélection en 2 étapes
  selectedCourseId?: string;
  onCourseChange?: (courseId: string) => void;
}

export function ContentReferenceSelector({
  conversationType,
  value,
  onChange,
  courses = [],
  exercises = [],
  errors = [],
  isLoading = false,
  error = null,
  disabled = false,
  selectedCourseId,
  onCourseChange
}: ContentReferenceSelectorProps) {
  // Ne rien afficher pour conversation générale
  if (conversationType === 'general') {
    return null;
  }

  // CAS SPÉCIAL : Exercices avec sélection en 2 étapes
  if (conversationType === 'exercise') {
    // Filtrer les exercices selon le cours sélectionné
    const filteredExercises = selectedCourseId
      ? exercises.filter(e => e.course_id === selectedCourseId)
      : [];

    return (
      <div className="space-y-3">
        {/* Étape 1 : Sélection du cours */}
        <div className="space-y-2">
          <Label htmlFor="course-for-exercise" className="text-sm font-medium">
            1. Sélectionnez le cours
          </Label>
          {isLoading ? (
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Chargement des cours...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>Erreur de chargement: {error.message}</AlertDescription>
            </Alert>
          ) : courses.length === 0 ? (
            <Alert>
              <AlertDescription className="text-sm">
                Aucun cours disponible. Ajoutez un cours depuis votre tableau de bord.
              </AlertDescription>
            </Alert>
          ) : (
            <Select value={selectedCourseId} onValueChange={onCourseChange} disabled={disabled}>
              <SelectTrigger id="course-for-exercise" className="w-full">
                <SelectValue placeholder="Choisir un cours" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Étape 2 : Sélection de l'exercice */}
        {selectedCourseId && (
          <div className="space-y-2">
            <Label htmlFor="exercise-reference" className="text-sm font-medium">
              2. Sélectionnez l'exercice
            </Label>
            {filteredExercises.length === 0 ? (
              <Alert>
                <AlertDescription className="text-sm">
                  Aucun exercice disponible pour ce cours.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger id="exercise-reference" className="w-full">
                  <SelectValue placeholder="Choisir un exercice" />
                </SelectTrigger>
                <SelectContent>
                  {filteredExercises.map((exercise) => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.exercice_title || `Exercice ${exercise.id.slice(0, 8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>
    );
  }

  // AUTRES CAS : Sélection simple
  let items: Array<{ id: string; label: string }> = [];
  let emptyMessage = '';
  let label = '';

  switch (conversationType) {
    case 'course':
      items = courses.map(c => ({ id: c.id, label: c.title }));
      emptyMessage = 'Aucun cours disponible. Ajoutez un cours depuis votre tableau de bord.';
      label = 'Sélectionnez un cours';
      break;

    case 'error':
      items = errors.map(err => ({
        id: err.id,
        label: `${err.matiere} - ${err.categorie} (${new Date(err.created_at).toLocaleDateString()})`
      }));
      emptyMessage = 'Aucune erreur enregistrée.';
      label = 'Sélectionnez une erreur';
      break;
  }

  // Afficher loading
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Chargement...</span>
        </div>
      </div>
    );
  }

  // Afficher erreur
  if (error) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <Alert variant="destructive">
          <AlertDescription>
            Erreur de chargement: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Afficher message si vide
  if (items.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <Alert>
          <AlertDescription className="text-sm">
            {emptyMessage}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Afficher le select
  return (
    <div className="space-y-2">
      <Label htmlFor="content-reference" className="text-sm font-medium">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="content-reference" className="w-full">
          <SelectValue placeholder={`Choisir ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
