import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, File, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useSubjects } from '@/hooks/useDocuments';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize, getFileTypeLabel } from '@/types/document';
import { createCourseWithRevisionSheet } from '@/services/revisionSheetService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const NEW_SUBJECT_VALUE = '__NEW_SUBJECT__';

const revisionSheetFormSchema = z.object({
  courseName: z.string().min(3, 'Le nom du cours doit contenir au moins 3 caractères'),
  subject: z.string().min(1, 'La matière est requise'),
  newSubjectName: z.string().optional(),
}).refine((data) => {
  // If new subject, require newSubjectName
  if (data.subject === NEW_SUBJECT_VALUE && !data.newSubjectName) {
    return false;
  }
  return true;
}, {
  message: 'Veuillez renseigner le nom de la nouvelle matière',
  path: ['newSubjectName'],
});

type RevisionSheetFormValues = z.infer<typeof revisionSheetFormSchema>;

interface CreateSheetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSheetModal({ open, onOpenChange }: CreateSheetModalProps) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [options, setOptions] = useState({
    includeConcepts: true,
    includeDefinitions: true,
    includeExamples: true,
    includeExercises: false,
  });

  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();

  const createMutation = useMutation({
    mutationFn: createCourseWithRevisionSheet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revision-sheets'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      toast.success('Fiche de révision en cours de création', {
        description: 'L\'IA génère votre fiche...',
      });
    },
    onError: (error: Error) => {
      console.error('Create error:', error);
      toast.error('Erreur lors de la création de la fiche');
    },
  });

  const form = useForm<RevisionSheetFormValues>({
    resolver: zodResolver(revisionSheetFormSchema),
    defaultValues: {
      courseName: '',
      subject: '',
      newSubjectName: '',
    },
  });

  const watchSubject = form.watch('subject');
  const isNewSubject = watchSubject === NEW_SUBJECT_VALUE;

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    form.clearErrors('root');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (values: RevisionSheetFormValues) => {
    try {
      // Validate file manually
      if (!selectedFile) {
        form.setError('root', { message: 'Veuillez sélectionner un fichier' });
        return;
      }

      if (selectedFile.size > MAX_FILE_SIZE) {
        form.setError('root', { message: `Fichier trop volumineux (max ${formatFileSize(MAX_FILE_SIZE)})` });
        return;
      }

      if (!ALLOWED_FILE_TYPES.includes(selectedFile.type as any)) {
        form.setError('root', { message: 'Type de fichier non supporté' });
        return;
      }

      // Simulate progress
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      // Create course with revision sheet
      await createMutation.mutateAsync({
        file: selectedFile,
        courseName: values.courseName,
        subject: isNewSubject ? values.newSubjectName! : values.subject,
        options,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Close dialog
      setSelectedFile(null);
      setUploadProgress(0);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Submit failed:', error);
      form.setError('root', { message: 'Erreur lors de la création. Veuillez réessayer.' });
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!createMutation.isPending) {
      setSelectedFile(null);
      setUploadProgress(0);
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une fiche de révision</DialogTitle>
          <DialogDescription>
            Importez un document pour générer automatiquement une fiche de révision avec l'IA
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* File Upload Zone */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Fichier
              </label>
              <div>
                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Glissez-déposez votre fichier ici
                    </p>
                    <p className="text-xs text-gray-500 mb-3">ou cliquez pour parcourir</p>
                    <p className="text-xs text-gray-400">
                      PDF, Word, Excel, PowerPoint, Images (max {formatFileSize(MAX_FILE_SIZE)})
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileInputChange}
                      accept={ALLOWED_FILE_TYPES.join(',')}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <File className="w-8 h-8 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getFileTypeLabel(selectedFile.type)} • {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      {!createMutation.isPending && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Course Name Input */}
            <FormField
              control={form.control}
              name="courseName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du cours</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Mathématiques - Chapitre 1"
                      disabled={createMutation.isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subject Selection */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matière</FormLabel>
                  <Select
                    disabled={loadingSubjects || createMutation.isPending}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une matière" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                      <SelectItem value={NEW_SUBJECT_VALUE}>
                        + Nouvelle matière
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* New Subject Name Input */}
            {isNewSubject && (
              <FormField
                control={form.control}
                name="newSubjectName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de la nouvelle matière</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Physique"
                        disabled={createMutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Options */}
            <div className="space-y-3">
              <Label>Options de génération</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="concepts"
                    checked={options.includeConcepts}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeConcepts: checked as boolean })
                    }
                    disabled={createMutation.isPending}
                  />
                  <label
                    htmlFor="concepts"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Concepts clés
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="definitions"
                    checked={options.includeDefinitions}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeDefinitions: checked as boolean })
                    }
                    disabled={createMutation.isPending}
                  />
                  <label
                    htmlFor="definitions"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Définitions importantes
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="examples"
                    checked={options.includeExamples}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeExamples: checked as boolean })
                    }
                    disabled={createMutation.isPending}
                  />
                  <label
                    htmlFor="examples"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Exemples pratiques
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exercises"
                    checked={options.includeExercises}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeExercises: checked as boolean })
                    }
                    disabled={createMutation.isPending}
                  />
                  <label
                    htmlFor="exercises"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Exercices d'entraînement
                  </label>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {createMutation.isPending && uploadProgress > 0 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500 text-center">
                  {uploadProgress < 100 ? `Upload en cours... ${uploadProgress}%` : 'Génération de la fiche...'}
                </p>
              </div>
            )}

            {/* Error Message */}
            {form.formState.errors.root && (
              <div className="text-sm text-red-600 text-center">
                {form.formState.errors.root.message}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createMutation.isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !selectedFile}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    L'IA génère votre fiche...
                  </>
                ) : (
                  'Créer la fiche'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
