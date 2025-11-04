/**
 * Cahier d'erreurs (Error Notebook) Page
 * Displays all user errors in a comprehensive table with filtering and sorting
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useAllErrors, ErrorWithDetails } from '@/hooks/useAllErrors';
import { useErrorRevisionList } from '@/hooks/useErrorRevisionList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BookOpen, FileQuestion, GraduationCap, Search, Filter, ChevronRight, Plus, Loader2, ImageIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import BottomNav from '@/components/BottomNav';
import BurgerMenu from '@/components/BurgerMenu';
import { ErrorRevisionModal } from '@/components/error-revision/ErrorRevisionModal';
import { ErrorAnalysisCard } from '@/components/error-revision/ErrorAnalysisCard';

type ErrorCategory = 'Compréhension' | 'Concentration' | 'Analyse' | 'Mémorisation' | 'Synthèse';

export default function CahierErreurs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [displayName, setDisplayName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState<string>('all');
  const [selectedCategorie, setSelectedCategorie] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch user profile for display name
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setDisplayName(
          profileData.full_name ||
            user.user_metadata?.full_name ||
            profileData.email ||
            user.email ||
            'Mon profil'
        );
      }
    };

    loadProfile();
  }, [user]);

  // Fetch all errors
  const { data: errors = [], isLoading } = useAllErrors();

  // Fetch error revisions (manual uploads)
  const { data: errorRevisions = [], isLoading: isLoadingRevisions } = useErrorRevisionList();

  // Group error revisions by course_name
  const groupedErrorRevisions = useMemo(() => {
    const groups: Record<string, typeof errorRevisions> = {};
    errorRevisions.forEach((revision) => {
      const key = revision.course_name;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(revision);
    });
    return groups;
  }, [errorRevisions]);

  // Get unique matieres for filter
  const matieres = useMemo(() => {
    const uniqueMatieres = new Set(errors.map((e) => e.matiere));
    return Array.from(uniqueMatieres).sort();
  }, [errors]);

  // Filter and search errors
  const filteredErrors = useMemo(() => {
    return errors.filter((error) => {
      const matchesSearch =
        searchTerm === '' ||
        error.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        error.matiere.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMatiere =
        selectedMatiere === 'all' || error.matiere === selectedMatiere;

      const matchesCategorie =
        selectedCategorie === 'all' || error.categorie === selectedCategorie;

      return matchesSearch && matchesMatiere && matchesCategorie;
    });
  }, [errors, searchTerm, selectedMatiere, selectedCategorie]);

  const getCategoryColor = (category: string): string => {
    const colors: Record<ErrorCategory, string> = {
      Compréhension: 'bg-purple-100 text-purple-800 border-purple-200',
      Concentration: 'bg-blue-100 text-blue-800 border-blue-200',
      Analyse: 'bg-green-100 text-green-800 border-green-200',
      Mémorisation: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Synthèse: 'bg-red-100 text-red-800 border-red-200',
    };

    return colors[category as ErrorCategory] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleReviser = (error: ErrorWithDetails) => {
    // Rediriger vers le professeur particulier virtuel avec le type "error" et l'ID de l'erreur
    navigate(`/student/professeur-particulier-virtuel?type=error&errorId=${error.id}`);
  };

  // Helper to get answer text from letter
  const getAnswerText = (question: any, answerLetter: string): string => {
    const answer = question.reponses?.find((r: any) => r.lettre === answerLetter);
    return answer ? `${answer.lettre}. ${answer.texte}` : answerLetter;
  };

  // Helper to get correct answer
  const getCorrectAnswer = (question: any): string => {
    const correctAnswer = question.reponses?.find((r: any) => r.correcte === 'true' || r.correcte === true);
    return correctAnswer ? `${correctAnswer.lettre}. ${correctAnswer.texte}` : 'N/A';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center space-x-2 md:space-x-4">
          <img
            src="/logo-savistas.png"
            alt="Savistas Logo"
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
          />
          <span className="font-semibold text-slate-800 text-base md:text-lg tracking-tight">
            {displayName || 'Mon profil'}
          </span>
        </div>
        <BurgerMenu />
      </header>

      {/* Main Content */}
      <div className="p-4 md:p-8 pt-24 md:pt-28 pb-32">
        <div className="max-w-7xl mx-auto">
          {/* Page Title with Action Button */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <GraduationCap className="w-8 h-8" />
                Cahier d'erreurs
              </h1>
              <p className="text-gray-600 mt-2">
                Consultez toutes vos erreurs et révisez pour progresser
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
              size={isMobile ? 'default' : 'lg'}
            >
              <Plus className="w-4 h-4 mr-2" />
              Réviser une erreur
            </Button>
          </div>

          {/* Filters and Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Rechercher dans les messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Matiere Filter */}
                <div>
                  <Select value={selectedMatiere} onValueChange={setSelectedMatiere}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les matières" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les matières</SelectItem>
                      {matieres.map((matiere) => (
                        <SelectItem key={matiere} value={matiere}>
                          {matiere}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div>
                  <Select value={selectedCategorie} onValueChange={setSelectedCategorie}>
                    <SelectTrigger>
                      <SelectValue placeholder="Toutes les catégories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      <SelectItem value="Compréhension">Compréhension</SelectItem>
                      <SelectItem value="Concentration">Concentration</SelectItem>
                      <SelectItem value="Analyse">Analyse</SelectItem>
                      <SelectItem value="Mémorisation">Mémorisation</SelectItem>
                      <SelectItem value="Synthèse">Synthèse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>
                    {filteredErrors.length} erreur{filteredErrors.length > 1 ? 's' : ''}{' '}
                    {filteredErrors.length !== errors.length && `sur ${errors.length}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Errors Tabs */}
          <Tabs defaultValue="exercises" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="exercises">
                Erreurs d'exercices ({filteredErrors.length})
              </TabsTrigger>
              <TabsTrigger value="uploaded">
                Erreurs téléchargées ({errorRevisions.length})
              </TabsTrigger>
            </TabsList>

            {/* Errors d'exercices Tab */}
            <TabsContent value="exercises">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Liste des erreurs d'exercices
                    <Badge variant="secondary" className="ml-auto">
                      {filteredErrors.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">
                  Chargement de vos erreurs...
                </div>
              ) : filteredErrors.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {errors.length === 0 ? (
                    <>
                      <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Aucune erreur enregistrée</p>
                      <p className="text-sm mt-2">
                        Continuez à travailler et vos erreurs apparaîtront ici pour vous aider
                        à progresser
                      </p>
                    </>
                  ) : (
                    <p>Aucune erreur ne correspond à vos critères de recherche</p>
                  )}
                </div>
              ) : isMobile ? (
                /* Mobile Card View */
                <div className="space-y-4">
                  {filteredErrors.map((error) => (
                    <Card key={error.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">
                              {format(new Date(error.created_at), 'dd/MM/yyyy', { locale: fr })}
                            </p>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {error.exercice_title || 'Question sans titre'}
                            </p>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <Badge variant="outline" className="font-normal text-xs">
                            {error.matiere}
                          </Badge>
                          <Badge className={`${getCategoryColor(error.categorie)} border text-xs`}>
                            {error.categorie}
                          </Badge>
                        </div>

                        {/* Message */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md border border-blue-100">
                            {error.message}
                          </p>
                        </div>

                        {/* Questions Accordion - Only the specific error question */}
                        {error.questions && error.questions.length > 0 && (() => {
                          // Get only the first question (specific to this error)
                          const question = error.questions[0];
                          const userResponse = error.user_responses?.find(
                            r => r.question_index === question.question_index
                          );

                          return (
                            <Accordion type="single" collapsible className="mb-4">
                              <AccordionItem value="question" className="border rounded-lg">
                                <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline">
                                  <span className="flex items-center gap-2">
                                    <ChevronRight className="w-4 h-4" />
                                    Voir la question
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 pb-3">
                                  <div className="border-l-2 border-blue-300 pl-3 py-2 bg-gray-50 rounded">
                                    <p className="text-sm font-semibold text-gray-900 mb-3">
                                      {question.question_titre}
                                    </p>
                                    {userResponse && (
                                      <>
                                        <div className="mb-2">
                                          <p className="text-xs font-medium text-red-600 mb-1">Ta réponse:</p>
                                          <p className="text-xs text-gray-700 bg-red-50 p-2 rounded border border-red-100">
                                            {getAnswerText(question, userResponse.user_answer)}
                                          </p>
                                        </div>
                                        <div>
                                          <p className="text-xs font-medium text-green-600 mb-1">Bonne réponse:</p>
                                          <p className="text-xs text-gray-700 bg-green-50 p-2 rounded border border-green-100">
                                            {getCorrectAnswer(question)}
                                          </p>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          );
                        })()}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/courses/${error.course_id}`)}
                            className="flex-1"
                          >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Cours
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/result/${error.exercice_id}`)}
                            className="flex-1"
                          >
                            <FileQuestion className="w-4 h-4 mr-2" />
                            QCM
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleReviser(error)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            Réviser
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Desktop Table View */
                <div className="overflow-x-auto">
                  <TooltipProvider delayDuration={500}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 z-10 bg-gray-50 min-w-[100px]">Date</TableHead>
                          <TableHead className="sticky left-[100px] z-10 bg-gray-50 min-w-[250px]">Titre de l'exercice</TableHead>
                          <TableHead>Matière</TableHead>
                          <TableHead>Catégorie</TableHead>
                          <TableHead className="min-w-[300px]">Message</TableHead>
                          <TableHead className="min-w-[350px]">Question</TableHead>
                          <TableHead className="min-w-[250px]">Ta réponse</TableHead>
                          <TableHead className="min-w-[250px]">Bonne réponse</TableHead>
                          <TableHead className="text-center">Cours</TableHead>
                          <TableHead className="text-center">QCM</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredErrors.map((error) => {
                          // Get the first question for this error (since we can't determine exact question)
                          const question = error.questions?.[0];
                          const userResponse = error.user_responses?.[0];

                          return (
                            <TableRow key={error.id} className="hover:bg-gray-50">
                              <TableCell className="sticky left-0 z-10 bg-gray-50 text-sm text-gray-600 whitespace-nowrap border-r">
                                {format(new Date(error.created_at), 'dd/MM/yyyy', { locale: fr })}
                              </TableCell>
                              <TableCell className="sticky left-[100px] z-10 bg-gray-50 font-medium border-r">
                                <p className="text-sm line-clamp-2">
                                  {error.exercice_title || 'Exercice sans titre'}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-normal">
                                  {error.matiere}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getCategoryColor(error.categorie)} border`}>
                                  {error.categorie}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-md">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="text-sm line-clamp-2 cursor-help">
                                      {error.message}
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    align="start"
                                    className="max-w-md p-3 bg-white text-gray-900 border border-gray-200 shadow-lg"
                                  >
                                    <p className="text-sm whitespace-normal">{error.message}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TableCell>
                              <TableCell className="max-w-md">
                                {question ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-sm line-clamp-2 cursor-help">
                                        {question.question_titre}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      align="start"
                                      className="max-w-md p-3 bg-white text-gray-900 border border-gray-200 shadow-lg"
                                    >
                                      <p className="text-sm whitespace-normal">{question.question_titre}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="text-xs text-gray-400">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="max-w-md">
                                {question && userResponse ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-sm line-clamp-2 cursor-help text-red-600">
                                        {getAnswerText(question, userResponse.user_answer)}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      align="start"
                                      className="max-w-md p-3 bg-white text-gray-900 border border-gray-200 shadow-lg"
                                    >
                                      <p className="text-sm whitespace-normal">{getAnswerText(question, userResponse.user_answer)}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="text-xs text-gray-400">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="max-w-md">
                                {question ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <p className="text-sm line-clamp-2 cursor-help text-green-600">
                                        {getCorrectAnswer(question)}
                                      </p>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="top"
                                      align="start"
                                      className="max-w-md p-3 bg-white text-gray-900 border border-gray-200 shadow-lg"
                                    >
                                      <p className="text-sm whitespace-normal">{getCorrectAnswer(question)}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <span className="text-xs text-gray-400">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/courses/${error.course_id}`)}
                                  className="hover:bg-purple-50"
                                >
                                  <BookOpen className="w-4 h-4" />
                                </Button>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/result/${error.exercice_id}`)}
                                  className="hover:bg-blue-50"
                                >
                                  <FileQuestion className="w-4 h-4" />
                                </Button>
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleReviser(error)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Réviser
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                </div>
              )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Erreurs téléchargées Tab */}
            <TabsContent value="uploaded">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Erreurs téléchargées
                    <Badge variant="secondary" className="ml-auto">
                      {errorRevisions.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingRevisions ? (
                    <div className="text-center py-12 text-gray-500">
                      Chargement de vos révisions d'erreurs...
                    </div>
                  ) : errorRevisions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Aucune erreur téléchargée</p>
                      <p className="text-sm mt-2">
                        Utilisez le bouton "Réviser une erreur" pour uploader vos erreurs
                      </p>
                    </div>
                  ) : (
                    <Accordion type="multiple" className="space-y-2">
                      {Object.entries(groupedErrorRevisions).map(([courseName, revisions]) => (
                        <AccordionItem key={courseName} value={courseName} className="border rounded-lg px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-2">
                              <div className="flex items-center gap-3">
                                <BookOpen className="w-4 h-4 text-purple-600" />
                                <span className="font-medium text-sm">{courseName}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {revisions.length} erreur{revisions.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-3 pt-2">
                              {revisions.map((revision) => (
                                <ErrorAnalysisCard key={revision.id} revision={revision} />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Error Revision Modal */}
      <ErrorRevisionModal open={isModalOpen} onOpenChange={setIsModalOpen} />

      {/* Bottom Navigation */}
      <div className="relative z-50">
        <BottomNav />
      </div>
    </div>
  );
}
