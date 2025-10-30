import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { addProcessingDocument } from '@/utils/documentProcessing';
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
import { Progress } from '@/components/ui/progress';
import { useDocumentUpload, useSubjects } from '@/hooks/useDocuments';
import { useUserCourses } from '@/hooks/useUserCourses';
import { useAuth } from '@/contexts/AuthContext';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, formatFileSize, getFileTypeLabel } from '@/types/document';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const NEW_SUBJECT_VALUE = '__NEW_SUBJECT__';

const documentFormSchema = z.object({
  documentName: z.string().min(1, 'Le nom du document est requis'),
  subject: z.string().min(1, 'La matière est requise'),
  newSubjectName: z.string().optional(),
}).refine((data) => {
  // If new subject, require newSubjectName
  if (data.subject === NEW_SUBJECT_VALUE) {
    return !!data.newSubjectName;
  }
  return true;
}, {
  message: 'Veuillez remplir le nom de la nouvelle matière',
  path: ['newSubjectName'],
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDocumentDialog({ open, onOpenChange }: AddDocumentDialogProps) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();
  const { data: courses = [], isLoading: loadingCourses } = useUserCourses(user?.id);
  const { mutateAsync: uploadDocument, isPending } = useDocumentUpload();

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      documentName: '',
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

  const onSubmit = async (values: DocumentFormValues) => {
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

      if (!user) {
        form.setError('root', { message: 'Utilisateur non connecté' });
        return;
      }

      // Simulate progress (since Supabase doesn't provide upload progress easily)
      setUploadProgress(0);
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const finalSubject = isNewSubject ? values.newSubjectName! : values.subject;

      // Find or create a default course for this subject
      let courseId: string;
      let isNewCourse = false;

      // Check if there's already a course for this subject
      const existingCourse = courses.find(c => c.subject === finalSubject);

      if (existingCourse) {
        courseId = existingCourse.id;
        console.log('✅ Using existing course:', existingCourse);
      } else {
        // Create a default course for this subject
        const { data: newCourse, error: courseError } = await supabase
          .from('courses')
          .insert({
            user_id: user.id,
            title: finalSubject,
            subject: finalSubject,
            description: `Cours de ${finalSubject}`,
          })
          .select()
          .single();

        if (courseError || !newCourse) {
          clearInterval(progressInterval);
          console.error('Error creating course:', courseError);
          form.setError('root', { message: 'Erreur lors de la création du cours' });
          return;
        }

        courseId = newCourse.id;
        isNewCourse = true;
        console.log('✅ Course created:', newCourse);
      }

      // Upload document to Supabase with hierarchical structure
      const uploadedDoc = await uploadDocument({
        file: selectedFile,
        subject: finalSubject,
        isNewSubject,
        newSubjectName: values.newSubjectName,
        courseId: courseId,
        documentName: values.documentName,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Track this document as processing immediately
      addProcessingDocument({
        documentId: uploadedDoc.id,
        documentName: values.documentName,
        courseId: courseId,
      });

      // Close dialog immediately
      setSelectedFile(null);
      setUploadProgress(0);
      form.reset();

      // Notify user that document is uploading
      toast.success('Document ajouté', {
        description: 'Le traitement IA est en cours...',
      });

      onOpenChange(false);

      // Call webhook in background (non-blocking)
      const webhookUrl = 'https://n8n.srv932562.hstgr.cloud/webhook/upload-document';
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: uploadedDoc.id,
          document_name: values.documentName,
          course_id: courseId,
          subject: finalSubject,
          user_id: user.id,
          file_path: uploadedDoc.file_path,
          is_new_course: isNewCourse, // Indicate if this is a newly created course
        }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Webhook error: ${response.statusText}`);
          }
          return response.json();
        })
        .then(webhookResponse => {
          console.log('✅ Webhook response:', webhookResponse);
        })
        .catch(webhookError => {
          console.error('❌ Webhook error:', webhookError);
          toast.error('Erreur lors du traitement du document');
        });
    } catch (error) {
      console.error('Upload failed:', error);
      form.setError('root', { message: 'Erreur lors de l\'upload. Veuillez réessayer.' });
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!isPending) {
      setSelectedFile(null);
      setUploadProgress(0);
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un document</DialogTitle>
          <DialogDescription>
            Importez un document pour accéder aux outils de révision
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
                            {!isPending && (
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

            {/* Subject Selection - First */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Matière</FormLabel>
                  <Select
                    disabled={loadingSubjects || isPending}
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
                        placeholder="Ex: Mathématiques"
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Document Name Input */}
            <FormField
              control={form.control}
              name="documentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du document</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Cours de mathématiques - Chapitre 1"
                      disabled={isPending}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload Progress */}
            {isPending && uploadProgress > 0 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500 text-center">
                  Téléchargement en cours... {uploadProgress}%
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
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending || !selectedFile}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload en cours...
                  </>
                ) : (
                  'Ajouter'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
