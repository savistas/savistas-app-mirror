import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Lightbulb, Pause, CheckCircle, Send, Mic } from 'lucide-react';
import { fetchRevisionSheetByCourseId } from '@/services/revisionSheetService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import BurgerMenu from '@/components/BurgerMenu';
import BottomNav from '@/components/BottomNav';

export default function AIRevisionSession() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [sheet, setSheet] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalQuestions] = useState(10);

  useEffect(() => {
    if (courseId && user) {
      initializeSession();
    }
  }, [courseId, user]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);

      // Fetch revision sheet
      const revisionSheet = await fetchRevisionSheetByCourseId(courseId!);
      if (!revisionSheet) {
        toast.error('Fiche de révision introuvable');
        navigate('/student/revision-sheets');
        return;
      }
      setSheet(revisionSheet);

      // Create AI conversation
      const { data: conversation, error } = await supabase
        .from('ai_teacher_conversations')
        .insert({
          user_id: user!.id,
          conversation_type: 'course',
          context_id: courseId,
          context_data: {
            revision_sheet_content: revisionSheet.file_url,
            mode: 'revision',
            course_title: revisionSheet.course.title,
          },
          agent_config: {
            personality: 'encourageant',
            systemPrompt: `Tu es un professeur bienveillant qui aide l'étudiant à réviser le cours "${revisionSheet.course.title}".
Pose des questions progressives sur le contenu de la fiche de révision.
Donne du feedback constructif et des encouragements.
Si l'étudiant se trompe, donne des indices sans donner directement la réponse.`,
          },
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      setConversationId(conversation.id);

      // Add initial message from AI
      const initialMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Bonjour ! Je suis ravi de t'aider à réviser "${revisionSheet.course.title}". Nous allons commencer par quelques questions sur les concepts clés. Peux-tu m'expliquer ce que tu as retenu de ce cours ?`,
        created_at: new Date().toISOString(),
      };
      setMessages([initialMessage]);
    } catch (error) {
      console.error('Error initializing session:', error);
      toast.error('Erreur lors de l\'initialisation de la session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      // Save message to database
      await supabase.from('ai_teacher_messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: inputMessage,
      });

      // Simulate AI response (in production, this would call your AI service)
      // For now, we'll use a simple response
      setTimeout(() => {
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `C'est une bonne réponse ! Continue comme ça. Passons à la question suivante...`,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiResponse]);
        setProgress((prev) => Math.min(prev + 10, 100));

        // Save AI response
        supabase.from('ai_teacher_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse.content,
        });

        setIsSending(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
      setIsSending(false);
    }
  };

  const handleEndSession = async () => {
    if (conversationId) {
      await supabase
        .from('ai_teacher_conversations')
        .update({ status: 'ended' })
        .eq('id', conversationId);
    }
    navigate('/student/revision-sheets');
  };

  if (isLoading) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between px-4 md:px-6 h-16 md:h-[4.5rem]">
            <div className="flex items-center space-x-2 md:space-x-4">
              <img
                src="/logo-savistas.png"
                alt="Savistas Logo"
                className="h-10 md:h-12 w-auto"
              />
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-slate-900">Session de Révision</h1>
                <p className="text-xs text-slate-500">Révisez avec l'IA</p>
              </div>
            </div>
            <BurgerMenu />
          </div>
        </header>
        <div className="container mx-auto pt-20 md:pt-24 pb-24 px-4 max-w-4xl">
          <Skeleton className="h-10 w-64 mb-6" />
          <Skeleton className="h-[600px] w-full" />
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      {/* Fixed Header avec logo et BurgerMenu */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 md:px-6 h-16 md:h-[4.5rem]">
          {/* Logo et titre */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <img
              src="/logo-savistas.png"
              alt="Savistas Logo"
              className="h-10 md:h-12 w-auto"
            />
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-slate-900">Session de Révision</h1>
              <p className="text-xs text-slate-500">{sheet?.course.title}</p>
            </div>
          </div>

          {/* Burger Menu */}
          <BurgerMenu />
        </div>
      </header>

      {/* Main Content avec padding pour le header fixe et bottom nav */}
      <div className="container mx-auto pt-20 md:pt-24 pb-24 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={handleEndSession}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Révision - {sheet?.course.title}</h1>
          <p className="text-sm text-muted-foreground">{sheet?.course.subject}</p>
        </div>
      </div>

      {/* Progress */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progression</span>
          <span className="text-sm text-muted-foreground">
            {Math.round((progress / 100) * totalQuestions)}/{totalQuestions} questions
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </Card>

      {/* Chat Interface */}
      <Card className="flex flex-col h-[500px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Tapez votre réponse..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="resize-none"
              rows={2}
            />
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isSending}
              >
                <Send className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" disabled>
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <Button variant="outline" size="sm" disabled>
          <Lightbulb className="mr-2 h-4 w-4" />
          Indice
        </Button>
        <Button variant="outline" size="sm" onClick={handleEndSession}>
          <Pause className="mr-2 h-4 w-4" />
          Pause
        </Button>
        <Button variant="outline" size="sm" onClick={handleEndSession} className="ml-auto">
          <CheckCircle className="mr-2 h-4 w-4" />
          Terminer
        </Button>
      </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </>
  );
}
