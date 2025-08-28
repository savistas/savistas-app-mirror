import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Question {
  id: string;
  part: string;
  text: string;
  options: { value: string; label: string }[];
  dbColumn: string;
}

// Questions de bienvenue avec mapping vers les colonnes de base de données
const questions: Question[] = [
  {
    id: 'q1',
    part: '1. Préférence d\'apprentissage',
    text: 'Quand tu veux comprendre une nouvelle idée…',
    dbColumn: 'pref_apprendre_idee',
    options: [
      { value: 'A', label: 'Je préfère voir un schéma, une image ou une vidéo.' },
      { value: 'B', label: 'J\'aime écouter quelqu\'un l\'expliquer à l\'oral.' },
      { value: 'C', label: 'Je préfère manipuler, tester, faire un exemple pratique.' },
      { value: 'D', label: 'J\'aime lire un texte ou un résumé.' },
    ],
  },
  {
    id: 'q2',
    part: '2. Mémoire et mémorisation',
    text: 'Quand tu apprends une poésie ou une leçon…',
    dbColumn: 'memoire_poesie',
    options: [
      { value: 'A', label: 'Je la lis et relis pour mémoriser.' },
      { value: 'B', label: 'Je l\'écoute plusieurs fois ou je la chante.' },
      { value: 'C', label: 'Je fais des gestes ou je marche en répétant.' },
      { value: 'D', label: 'J\'invente des dessins ou des couleurs pour me souvenir.' },
    ],
  },
  {
    id: 'q3',
    part: '3. Résolution de problèmes',
    text: 'Quand tu dois résoudre un problème de maths…',
    dbColumn: 'resoudre_maths',
    options: [
      { value: 'A', label: 'Je dessine le problème sous forme de schéma.' },
      { value: 'B', label: 'Je réfléchis étape par étape, comme un calcul logique.' },
      { value: 'C', label: 'J\'aime en discuter avec quelqu\'un.' },
      { value: 'D', label: 'Je préfère imaginer une situation réelle pour tester.' },
    ],
  },
  {
    id: 'q4',
    part: '4. Intérêts personnels',
    text: 'Quand tu as du temps libre, tu préfères…',
    dbColumn: 'temps_libre_pref',
    options: [
      { value: 'A', label: 'Lire ou écrire (journal, histoire, poème).' },
      { value: 'B', label: 'Jouer d\'un instrument ou écouter de la musique.' },
      { value: 'C', label: 'Faire du sport, bouger, bricoler.' },
      { value: 'D', label: 'Observer la nature, les animaux, les plantes.' },
    ],
  },
  {
    id: 'q5',
    part: '5. Travail en groupe',
    text: 'Quand tu travailles en groupe…',
    dbColumn: 'travail_groupe_role',
    options: [
      { value: 'A', label: 'Je préfère écouter et ensuite donner mon avis.' },
      { value: 'B', label: 'J\'aime organiser les idées et trouver une logique.' },
      { value: 'C', label: 'Je participe activement aux échanges.' },
      { value: 'D', label: 'Je propose souvent de dessiner ou visualiser nos idées.' },
    ],
  },
  {
    id: 'q6',
    part: '6. Rétention d\'information',
    text: 'Quand tu dois retenir une information importante…',
    dbColumn: 'retenir_info',
    options: [
      { value: 'A', label: 'Je la réécris plusieurs fois.' },
      { value: 'B', label: 'Je l\'associe à une mélodie ou un rythme.' },
      { value: 'C', label: 'J\'en fais un dessin ou un schéma.' },
      { value: 'D', label: 'Je l\'explique à quelqu\'un ou je la mets en pratique.' },
    ],
  },
  {
    id: 'q7',
    part: '7. Préférence d\'enseignement',
    text: 'En classe, tu préfères que l\'enseignant…',
    dbColumn: 'pref_enseignant',
    options: [
      { value: 'A', label: 'Fasse un dessin ou une carte mentale au tableau.' },
      { value: 'B', label: 'Explique avec beaucoup d\'exemples concrets.' },
      { value: 'C', label: 'Raconte et détaille la leçon à l\'oral.' },
      { value: 'D', label: 'Donne un texte ou un document à lire.' },
    ],
  },
  {
    id: 'q8',
    part: '8. Découverte de nouveaux lieux',
    text: 'Quand tu découvres un nouvel endroit…',
    dbColumn: 'decouvrir_endroit',
    options: [
      { value: 'A', label: 'J\'observe les lieux et les détails autour de moi.' },
      { value: 'B', label: 'J\'écoute les sons, les voix, l\'ambiance.' },
      { value: 'C', label: 'J\'explore en marchant et en touchant les choses.' },
      { value: 'D', label: 'Je préfère lire un plan ou des informations écrites.' },
    ],
  },
  {
    id: 'q9',
    part: '9. Définition de la réussite',
    text: 'Pour toi, réussir c\'est surtout…',
    dbColumn: 'reussir_definition',
    options: [
      { value: 'A', label: 'Bien comprendre les mots et savoir les utiliser.' },
      { value: 'B', label: 'Trouver la solution logique à un problème.' },
      { value: 'C', label: 'Savoir travailler en équipe avec les autres.' },
      { value: 'D', label: 'Découvrir par soi-même et exprimer sa créativité.' },
    ],
  },
  {
    id: 'q10',
    part: '10. Rappel de souvenirs',
    text: 'Quand tu veux te souvenir d\'un moment important…',
    dbColumn: 'souvenir_important',
    options: [
      { value: 'A', label: 'Je revois les images dans ma tête.' },
      { value: 'B', label: 'Je me rappelle ce que j\'ai entendu ou dit.' },
      { value: 'C', label: 'Je revois les gestes que j\'ai faits.' },
      { value: 'D', label: 'Je relis mes notes ou ce que j\'ai écrit.' },
    ],
  },
];

// Règles de scoring pour calculer les styles d'apprentissage
const scoringRules: Record<string, Record<string, Record<string, number>>> = {
  q1: {
    A: { score_visuel: 1, score_spatial: 1 },
    B: { score_auditif: 1, score_linguistique: 1 },
    C: { score_kinesthésique: 1 },
    D: { score_lecture: 1 },
  },
  q2: {
    A: { score_linguistique: 1 },
    B: { score_musicale: 1, score_auditif: 1 },
    C: { score_kinesthésique: 1 },
    D: { score_visuel: 1 },
  },
  q3: {
    A: { score_spatial: 1 },
    B: { score_logique_mathematique: 1 },
    C: { score_interpersonnelle: 1 },
    D: { score_kinesthésique: 1 },
  },
  q4: {
    A: { score_linguistique: 1 },
    B: { score_musicale: 1 },
    C: { score_kinesthésique: 1 },
    D: { score_naturaliste: 1 },
  },
  q5: {
    A: { score_intrapersonnelle: 1 },
    B: { score_logique_mathematique: 1 },
    C: { score_interpersonnelle: 1 },
    D: { score_spatial: 1, score_visuel: 1 },
  },
  q6: {
    A: { score_ecriture: 1 },
    B: { score_musicale: 1 },
    C: { score_visuel: 1 },
    D: { score_kinesthésique: 1, score_interpersonnelle: 1 },
  },
  q7: {
    A: { score_visuel: 1 },
    B: { score_kinesthésique: 1 },
    C: { score_auditif: 1 },
    D: { score_lecture: 1 },
  },
  q8: {
    A: { score_spatial: 1 },
    B: { score_auditif: 1 },
    C: { score_kinesthésique: 1 },
    D: { score_lecture: 1 },
  },
  q9: {
    A: { score_linguistique: 1 },
    B: { score_logique_mathematique: 1 },
    C: { score_interpersonnelle: 1 },
    D: { score_intrapersonnelle: 1, score_spatial: 1 },
  },
  q10: {
    A: { score_visuel: 1 },
    B: { score_auditif: 1 },
    C: { score_kinesthésique: 1 },
    D: { score_lecture: 1, score_ecriture: 1 },
  },
};

interface ProfileQuestionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionKey: string;
  currentValue: string;
  onSave: (newValue: string) => void;
}

const ProfileQuestionEditModal: React.FC<ProfileQuestionEditModalProps> = ({
  isOpen,
  onClose,
  questionKey,
  currentValue,
  onSave,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Trouver la question correspondante
  const question = questions.find(q => q.dbColumn === questionKey);

  useEffect(() => {
    if (isOpen && question && currentValue) {
      // Trouver la valeur correspondante basée sur le label actuel
      const matchingOption = question.options.find(option => option.label === currentValue);
      setSelectedValue(matchingOption?.value || '');
    }
  }, [isOpen, question, currentValue]);

  const handleSave = async () => {
    if (!user || !question || !selectedValue) return;

    setLoading(true);
    try {
      // Trouver le label correspondant à la valeur sélectionnée
      const selectedOption = question.options.find(option => option.value === selectedValue);
      if (!selectedOption) {
        throw new Error('Option sélectionnée non trouvée');
      }

      // Mettre à jour dans profiles_infos
      const { error: profileError } = await supabase
        .from('profiles_infos')
        .update({ [questionKey]: selectedOption.label })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Récupérer toutes les réponses actuelles pour recalculer les scores
      const { data: allAnswers, error: fetchError } = await supabase
        .from('profiles_infos')
        .select('pref_apprendre_idee,memoire_poesie,resoudre_maths,temps_libre_pref,travail_groupe_role,retenir_info,pref_enseignant,decouvrir_endroit,reussir_definition,souvenir_important')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Recalculer les scores d'apprentissage
      const learningStyleScores: Record<string, number> = {
        score_visuel: 0,
        score_spatial: 0,
        score_auditif: 0,
        score_linguistique: 0,
        score_kinesthésique: 0,
        score_lecture: 0,
        score_ecriture: 0,
        score_logique_mathematique: 0,
        score_interpersonnelle: 0,
        score_musicale: 0,
        score_naturaliste: 0,
        score_intrapersonnelle: 0,
      };

      // Mapper les réponses aux questions pour le calcul
      const answerMapping: Record<string, string> = {
        'pref_apprendre_idee': 'q1',
        'memoire_poesie': 'q2',
        'resoudre_maths': 'q3',
        'temps_libre_pref': 'q4',
        'travail_groupe_role': 'q5',
        'retenir_info': 'q6',
        'pref_enseignant': 'q7',
        'decouvrir_endroit': 'q8',
        'reussir_definition': 'q9',
        'souvenir_important': 'q10',
      };

      // Calculer les scores basés sur toutes les réponses
      for (const [dbColumn, questionId] of Object.entries(answerMapping)) {
        const answerText = allAnswers[dbColumn as keyof typeof allAnswers];
        if (answerText) {
          // Trouver la question correspondante
          const questionData = questions.find(q => q.id === questionId);
          if (questionData) {
            // Trouver l'option correspondante au texte de réponse
            const matchingOption = questionData.options.find(option => option.label === answerText);
            if (matchingOption && scoringRules[questionId] && scoringRules[questionId][matchingOption.value]) {
              const scoresToAdd = scoringRules[questionId][matchingOption.value];
              for (const [style, points] of Object.entries(scoresToAdd)) {
                learningStyleScores[style] += points;
              }
            }
          }
        }
      }

      // Mettre à jour ou insérer dans styles_apprentissage
      const { data: existingStyle, error: fetchStyleError } = await supabase
        .from('styles_apprentissage')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (fetchStyleError && fetchStyleError.code !== 'PGRST116') {
        throw fetchStyleError;
      }

      let styleError;
      if (existingStyle) {
        // Mettre à jour les scores existants
        const { error } = await supabase
          .from('styles_apprentissage')
          .update(learningStyleScores)
          .eq('user_id', user.id);
        styleError = error;
      } else {
        // Insérer de nouveaux scores
        const { error } = await supabase
          .from('styles_apprentissage')
          .insert({ user_id: user.id, ...learningStyleScores });
        styleError = error;
      }

      if (styleError) throw styleError;

      // Notifier le parent du changement
      onSave(selectedOption.label);
      
      toast({
        title: "Réponse mise à jour",
        description: "Votre réponse et votre profil d'apprentissage ont été mis à jour avec succès",
      });

      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de sauvegarder la réponse",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Réinitialiser la sélection à la valeur actuelle
    if (question && currentValue) {
      const matchingOption = question.options.find(option => option.label === currentValue);
      setSelectedValue(matchingOption?.value || '');
    }
    onClose();
  };

  if (!question) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-lg"
        aria-labelledby="question-edit-title"
        aria-describedby="question-edit-description"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle id="question-edit-title" className="text-xl font-semibold text-gray-800">
              {question.part}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              disabled={loading}
              aria-label="Fermer la modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div id="question-edit-description">
            <p className="text-lg text-gray-600 mb-6">{question.text}</p>
          </div>

          <div className="space-y-4">
            <RadioGroup
              value={selectedValue}
              onValueChange={setSelectedValue}
              className="space-y-3"
              aria-label={`Options pour: ${question.text}`}
            >
              {question.options.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedValue === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedValue(option.value)}
                >
                  <RadioGroupItem 
                    value={option.value} 
                    id={`option-${option.value}`}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor={`option-${option.value}`} 
                    className="flex-grow cursor-pointer text-sm leading-relaxed"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !selectedValue}
              className="min-w-[100px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileQuestionEditModal;