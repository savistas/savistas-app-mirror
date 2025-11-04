import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import BurgerMenu from "@/components/BurgerMenu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Plus,
  Loader2,
  History,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks"; // Import remark-breaks
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// Local types to avoid dependency on generated Supabase types
type Conversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender: "user" | "bot";
  content: string;
  created_at: string;
};

const WEBHOOK_URL = "https://n8n.srv932562.hstgr.cloud/webhook/chatbot-savistas";

const suggestedQuestions = [
  "Explique-moi les fonctions affines",
  "Comment résoudre une équation du second degré ?",
  "Quelles sont les propriétés des triangles ?",
  "Aide-moi avec la conjugaison des verbes",
];

const sanitizeContent = (input: string) => {
  try {
    if (!input) return "";
    const trimmed = input.trim();

    // If webhook wrapped the markdown inside an <iframe srcdoc="...">, extract and decode it
    if (trimmed.startsWith("<iframe")) {
      const doc = new DOMParser().parseFromString(trimmed, "text/html");
      const iframe = doc.querySelector("iframe");
      const srcdoc = iframe?.getAttribute("srcdoc") || "";
      const decoder = document.createElement("textarea");
      decoder.innerHTML = srcdoc;
      return (decoder.value || decoder.textContent || "").trim();
    }

    // Return the original trimmed input, let ReactMarkdown handle it
    return trimmed;
  } catch {
    return input;
  }
};

const Messaging = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // État pour le pop-up de confirmation
  const [botMessageLoading, setBotMessageLoading] = useState(false); // État pour l'effet de flou du message du bot

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Réinitialiser la hauteur pour calculer la nouvelle
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]); // Déclencher l'effet quand le message change

  const handleDeleteConversation = async () => {
    if (!activeConversationId) return;

    try {
      // Supprimer la conversation (les messages devraient être supprimés en cascade si la FK est configurée)
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", activeConversationId);

      if (error) {
        throw error;
      }

      toast({ title: "Succès", description: "Conversation supprimée.", variant: "default" });

      // Mettre à jour l'état des conversations
      setConversations((prev) => prev.filter((c) => c.id !== activeConversationId));
      setActiveConversationId(null); // Réinitialiser la conversation active
      setMessages([]); // Effacer les messages affichés
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Une erreur est survenue lors de la suppression.", variant: "destructive" });
    }
  };

  // Load conversations for the current user
  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    const load = async () => {
      setLoadingConversations(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) {
        toast({ title: "Erreur", description: "Impossible de charger l'historique.", variant: "destructive" });
      } else if (mounted) {
        setConversations(data as Conversation[]);
        // Don't auto-select any conversation - start with a blank conversation
        // User can select from history if they want to continue a previous conversation
      }
      setLoadingConversations(false);
    };
    load();
    return () => { mounted = false; };
  }, [user?.id]);

  // Load messages when the active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    let mounted = true;
    const load = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeConversationId)
        .order("created_at", { ascending: true });
      if (error) {
        toast({ title: "Erreur", description: "Impossible de charger les messages.", variant: "destructive" });
      } else if (mounted) {
        setMessages(data as MessageRow[]);
      }
      setLoadingMessages(false);
    };
    load();
    return () => { mounted = false; };
  }, [activeConversationId]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const startNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setMessage("");
  };

  const truncateTitle = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length <= 30) return trimmed || "Nouvelle conversation";
    return `${trimmed.slice(0, 30)}…`;
  };

  const handleSendMessage = async () => {
    const text = message.trim();
    if (!text || !user?.id || sending) return;
    setSending(true);

    try {
      let conversationId = activeConversationId;

      // Create conversation on first message
      if (!conversationId) {
        const title = truncateTitle(text) || "Nouvelle conversation";
        const { data: convData, error: convError } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, title })
          .select()
          .single();
        if (convError || !convData) {
          throw convError || new Error("Création de la conversation échouée");
        }
        conversationId = convData.id;
        setConversations((prev) => [{ ...(convData as Conversation) }, ...prev]);
        setActiveConversationId(conversationId);
      }

      // Insert user message
      const userMsg: Omit<MessageRow, "id" | "created_at"> = {
        conversation_id: conversationId!,
        sender: "user",
        content: text,
      } as any;

      const { data: insUserMsg, error: insUserErr } = await supabase
        .from("messages")
        .insert(userMsg)
        .select()
        .single();
      if (insUserErr || !insUserMsg) throw insUserErr || new Error("Envoi du message échoué");

      setMessages((prev) => [...prev, insUserMsg as MessageRow]);
      setMessage("");

      // Call webhook
      const resp = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversation_id: conversationId, user_id: user.id }),
      });

const botRaw = await resp.text();
const botMarkdown = sanitizeContent(botRaw);

// Insert bot message
const botMsg: Omit<MessageRow, "id" | "created_at"> = {
  conversation_id: conversationId!,
  sender: "bot",
  content: botMarkdown || "",
} as any;

      setBotMessageLoading(true); // Activer le flou avant d'afficher le message du bot

      const { data: insBotMsg, error: insBotErr } = await supabase
        .from("messages")
        .insert(botMsg)
        .select()
        .single();
      if (insBotErr || !insBotMsg) throw insBotErr || new Error("Réponse du bot échouée");

      setMessages((prev) => [...prev, insBotMsg as MessageRow]);
      setTimeout(() => setBotMessageLoading(false), 500); // Désactiver le flou après un court délai

      // Move conversation to top
      setConversations((prev) => {
        const updated = prev.map((c) => (c.id === conversationId ? { ...c, updated_at: new Date().toISOString() } : c));
        updated.sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));
        return updated;
      });
    } catch (e: any) {
      toast({ title: "Erreur", description: e?.message || "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center space-x-2 md:space-x-4">
          <img src="/logo-savistas.png" alt="Savistas Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
          <span className="font-semibold text-slate-800 text-base md:text-lg tracking-tight">AI Assistant</span>
        </div>
        <BurgerMenu />
      </header>

      {/* Toolbar with conversation controls */}
      <div className="fixed top-16 md:top-[4.5rem] left-0 right-0 z-40 flex items-center justify-end p-4 border-b border-border bg-background">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={startNewConversation}>
            <Plus className="w-4 h-4" />
            <span className="ml-1 hidden md:inline">Nouveau</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <History className="w-4 h-4" />
                <span className="ml-1 hidden md:inline">Historique</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Conversations récentes</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {loadingConversations ? (
                <DropdownMenuItem disabled>Chargement…</DropdownMenuItem>
              ) : conversations.length === 0 ? (
                <DropdownMenuItem disabled>Aucune conversation.</DropdownMenuItem>
              ) : (
                conversations.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => setActiveConversationId(c.id)}>
                    {truncateTitle(c.title)}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {activeConversationId && (
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4" />
                  <span className="ml-1 hidden md:inline">Supprimer</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action ne peut pas être annulée. Cela supprimera définitivement votre conversation et tous les messages associés de nos serveurs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { handleDeleteConversation(); setShowDeleteConfirm(false); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Chat area */}
      <main className="flex-1 flex flex-col pt-32 md:pt-40">
        {/* Messages container - full height with padding for fixed input */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto animate-fade-in pb-[240px] md:pb-[200px] md:w-[70%] md:mx-auto">
          {loadingMessages ? (
            <div className="text-sm text-muted-foreground">Chargement des messages…</div>
          ) : messages.length === 0 && !activeConversationId ? (
            <div className="max-w-2xl mx-auto">
              <div className="text-sm text-muted-foreground mb-3">Questions suggérées :</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedQuestions.map((q) => (
                  <Button key={q} variant="outline" size="sm" className="justify-start h-auto p-3 whitespace-normal" onClick={() => setMessage(q)}>
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            messages.filter((m) => (m.content || "").trim().length > 0).map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}>
                <div className={`${msg.sender === "bot" ? "w-full" : "max-w-[95%] md:max-w-[65%]"} ${msg.sender === "bot" ? "order-2" : "order-1"}`}>
                  {msg.sender === "bot" && (
                    <div className="flex items-center space-x-2 mb-1">
                      <img src="/logo-savistas.png" alt="Savistas Logo" className="w-5 h-5 object-contain" />
                      <span className="text-xs text-muted-foreground">AI Assistant</span>
                    </div>
                  )}
                  <div className={`p-3 rounded-lg ${msg.sender === "bot" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"} ${msg.sender === "bot" && botMessageLoading ? "blur-sm transition-all duration-500" : ""}`}>
                    <div className="prose max-w-none prose-a:text-primary prose-invert:prose-strong:font-semibold">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm, remarkBreaks]}
                        components={{
                          h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mb-4" {...props} />,
                          h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mb-3 text-primary" {...props} />,
                          h3: ({ node, ...props }) => <h3 className="text-xl font-bold mb-2" {...props} />,
                          p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
                          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
                          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                          hr: ({ node, ...props }) => <hr className="my-8 border-t border-gray-300" {...props} />,
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse my-4" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => <thead {...props} />,
                          tbody: ({ node, ...props }) => <tbody {...props} />,
                          th: ({ node, ...props }) => <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-bold text-left text-base" {...props} />,
                          td: ({ node, ...props }) => <td className="border border-gray-300 px-4 py-2 text-base" {...props} />,
                        }}
                      >
                        {sanitizeContent(msg.content)}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {sending && (
            <div className="flex justify-start">
              <div className="w-full">
                <div className="flex items-center space-x-2 mb-1">
                  <img src="/logo-savistas.png" alt="Savistas Logo" className="w-5 h-5 object-contain" />
                  <span className="text-xs text-muted-foreground">AI Assistant</span>
                </div>
                <div className="p-3 rounded-lg bg-muted text-foreground inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rédaction de la réponse…</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Input Bar - Centered horizontally, positioned towards bottom */}
      <div className="fixed bottom-32 md:bottom-24 left-1/2 transform -translate-x-1/2 w-full md:w-[70%] max-w-none md:max-w-none px-[26px] z-50">
        <div className="flex items-end gap-2">
          <div className="flex-1 border border-border rounded-2xl bg-background shadow-sm hover:shadow-md transition-shadow duration-200 px-4 py-3 flex items-center">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tapez votre message…"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={1}
              className="w-full resize-none max-h-[400px] overflow-y-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent p-0 leading-normal"
              aria-label="Message"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            size="icon"
            disabled={sending}
            className="bg-primary hover:bg-primary/90 rounded-xl h-10 w-10 flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={1.5} />}
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="relative z-50">
      </div>
    </div>
  );
};

export default Messaging;
