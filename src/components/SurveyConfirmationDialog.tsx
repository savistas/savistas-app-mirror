import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SurveyConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void; // User chooses to answer the survey
  onCancel: () => void; // User chooses not to answer
}

const SurveyConfirmationDialog: React.FC<SurveyConfirmationDialogProps> = ({ isOpen, onConfirm, onCancel }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={() => { /* Prevent closing by clicking outside */ }}>
      <AlertDialogContent className="!w-[90vw] mx-auto rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl">Tu es sûr de ne pas vouloir répondre ?</AlertDialogTitle>
          <AlertDialogDescription>
            Répondre au questionnaire ne te prendra que <span className="font-bold">quelques minutes</span>, et permettra vraiment d'adapter les réponses et les <span className="font-bold">exercices</span> à tes besoins.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Non, merci</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Oui, je veux répondre</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SurveyConfirmationDialog;
