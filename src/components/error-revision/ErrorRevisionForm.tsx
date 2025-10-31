/**
 * ErrorRevisionForm Component
 * Form for uploading manual error revisions with validation
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileUploadZone } from './FileUploadZone';
import { ErrorRevisionFormData } from '@/types/errorRevision';
import { useSubjects } from '@/hooks/useDocuments';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const ACCEPTED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const NEW_SUBJECT_VALUE = '__NEW_SUBJECT__';

export const errorRevisionSchema = z.object({
  errorImage: z
    .instanceof(File, { message: 'La photo de l\'erreur est obligatoire' })
    .refine((file) => file.size <= MAX_FILE_SIZE, 'La taille maximale est 10MB')
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      'Format accepté: JPG, PNG, PDF'
    ),

  courseDocument: z
    .instanceof(File, { message: 'Le document de cours est obligatoire' })
    .refine((file) => file.size <= MAX_FILE_SIZE, 'La taille maximale est 10MB')
    .refine(
      (file) => ACCEPTED_DOCUMENT_TYPES.includes(file.type),
      'Format accepté: PDF, JPG, PNG'
    ),

  subject: z.string().min(1, 'La matière est obligatoire'),

  newSubjectName: z.string().optional(),

  courseName: z.string().min(1, 'Le nom du cours est obligatoire'),

  userMessage: z.string().max(500, 'Maximum 500 caractères').optional(),
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

export type ErrorRevisionFormValues = z.infer<typeof errorRevisionSchema>;

interface ErrorRevisionFormProps {
  onSubmit: (data: ErrorRevisionFormData) => void;
  disabled?: boolean;
}

export const ErrorRevisionForm = ({ onSubmit, disabled = false }: ErrorRevisionFormProps) => {
  const { data: subjects = [], isLoading: loadingSubjects } = useSubjects();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<ErrorRevisionFormValues>({
    resolver: zodResolver(errorRevisionSchema),
    mode: 'onChange',
    defaultValues: {
      subject: '',
      newSubjectName: '',
      courseName: '',
      userMessage: '',
    },
  });

  const userMessage = watch('userMessage');
  const watchSubject = watch('subject');
  const isNewSubject = watchSubject === NEW_SUBJECT_VALUE;

  const handleFormSubmit = (data: ErrorRevisionFormValues) => {
    // If new subject, use newSubjectName as the subject
    const finalData: ErrorRevisionFormData = {
      errorImage: data.errorImage,
      courseDocument: data.courseDocument,
      subject: data.subject === NEW_SUBJECT_VALUE ? data.newSubjectName! : data.subject,
      courseName: data.courseName,
      userMessage: data.userMessage,
    };
    onSubmit(finalData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Error Image Upload */}
      <Controller
        name="errorImage"
        control={control}
        render={({ field }) => (
          <FileUploadZone
            value={field.value}
            onChange={field.onChange}
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            label="Photo de l'erreur"
            required
            disabled={disabled}
            error={errors.errorImage?.message}
          />
        )}
      />

      {/* Course Document Upload */}
      <Controller
        name="courseDocument"
        control={control}
        render={({ field }) => (
          <FileUploadZone
            value={field.value}
            onChange={field.onChange}
            accept="application/pdf,image/jpeg,image/jpg,image/png"
            label="Document du cours"
            required
            disabled={disabled}
            error={errors.courseDocument?.message}
          />
        )}
      />

      {/* Subject - Dropdown */}
      <div className="space-y-2">
        <Label htmlFor="subject">
          Matière <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="subject"
          control={control}
          render={({ field }) => (
            <Select
              disabled={loadingSubjects || disabled}
              onValueChange={field.onChange}
              value={field.value}
            >
              <SelectTrigger className={errors.subject ? 'border-red-300' : ''}>
                <SelectValue placeholder="Sélectionnez une matière" />
              </SelectTrigger>
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
          )}
        />
        {errors.subject && (
          <p className="text-sm text-red-500">{errors.subject.message}</p>
        )}
      </div>

      {/* New Subject Name Input */}
      {isNewSubject && (
        <div className="space-y-2">
          <Label htmlFor="newSubjectName">
            Nom de la nouvelle matière <span className="text-red-500">*</span>
          </Label>
          <Controller
            name="newSubjectName"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="newSubjectName"
                placeholder="Ex: Mathématiques, Français..."
                disabled={disabled}
                className={errors.newSubjectName ? 'border-red-300' : ''}
              />
            )}
          />
          {errors.newSubjectName && (
            <p className="text-sm text-red-500">{errors.newSubjectName.message}</p>
          )}
        </div>
      )}

      {/* Course Name */}
      <div className="space-y-2">
        <Label htmlFor="courseName">
          Nom du cours <span className="text-red-500">*</span>
        </Label>
        <Controller
          name="courseName"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              id="courseName"
              placeholder="Ex: Théorème de Pythagore, Grammaire française..."
              disabled={disabled}
              className={errors.courseName ? 'border-red-300' : ''}
            />
          )}
        />
        {errors.courseName && (
          <p className="text-sm text-red-500">{errors.courseName.message}</p>
        )}
      </div>

      {/* User Message (optional) */}
      <div className="space-y-2">
        <Label htmlFor="userMessage">
          Message explicatif (optionnel)
        </Label>
        <Controller
          name="userMessage"
          control={control}
          render={({ field }) => (
            <Textarea
              {...field}
              id="userMessage"
              placeholder="Expliquez ce que vous n'avez pas compris ou ajoutez des directives particulières..."
              disabled={disabled}
              rows={4}
              className={errors.userMessage ? 'border-red-300' : ''}
            />
          )}
        />
        <div className="flex justify-between items-center">
          {errors.userMessage && (
            <p className="text-sm text-red-500">{errors.userMessage.message}</p>
          )}
          <p className="text-xs text-gray-500 ml-auto">
            {userMessage?.length || 0}/500 caractères
          </p>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={disabled}
          className="flex-1"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={disabled || !isValid}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {disabled ? 'Analyse en cours...' : 'Analyser l\'erreur'}
        </Button>
      </div>
    </form>
  );
};
