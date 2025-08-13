import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Bot,
  Menu,
  Send,
  Plus,
  Loader2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

    // If any other HTML slips in, strip tags to plain text
    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
      const div = document.createElement("div");
      div.innerHTML = trimmed;
      return (div.textContent || "").trim();
    }

    // Already plain markdown/text
    return trimmed;
  } catch {
    return input;
  }
};

const Messaging = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { user } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

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
        // Auto-select the most recent conversation
        if (!activeConversationId && data && data.length > 0) {
          setActiveConversationId(data[0].id);
        }
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

      const { data: insBotMsg, error: insBotErr } = await supabase
        .from("messages")
        .insert(botMsg)
        .select()
        .single();
      if (insBotErr || !insBotMsg) throw insBotErr || new Error("Réponse du bot échouée");

      setMessages((prev) => [...prev, insBotMsg as MessageRow]);

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

  const Sidebar = (
    <aside className="hidden md:flex w-72 shrink-0 border-r border-border flex-col">
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center space-x-2">
          <Bot className="w-5 h-5 text-primary" strokeWidth={1.5} />
          <span className="font-medium text-foreground">Historique</span>
        </div>
        <Button variant="outline" size="sm" onClick={startNewConversation}>
          <Plus className="w-4 h-4 mr-1" /> Nouveau
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loadingConversations ? (
          <div className="p-4 text-sm text-muted-foreground">Chargement…</div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Aucune conversation.</div>
        ) : (
          <ul className="p-2">
            {conversations.map((c) => (
              <li key={c.id}>
                <Button
                  variant={c.id === activeConversationId ? "secondary" : "ghost"}
                  className="w-full justify-start truncate"
                  onClick={() => setActiveConversationId(c.id)}
                >
                  {c.title || "Conversation"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row pb-28">
      {/* Desktop sidebar */}
      {Sidebar}

      {/* Mobile header with drawer trigger */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background z-10">
        <div className="flex items-center space-x-3">
          <Bot className="w-6 h-6 text-primary" strokeWidth={1.5} />
          <span className="font-medium text-foreground">AI Assistant</span>
        </div>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Historique">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-5/6 p-0">
            <SheetHeader className="p-4">
              <SheetTitle>Historique</SheetTitle>
            </SheetHeader>
            <div className="p-2 border-t border-border">
              <Button variant="outline" size="sm" className="w-full" onClick={() => { startNewConversation(); setSidebarOpen(false); }}>
                <Plus className="w-4 h-4 mr-1" /> Nouveau
              </Button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {loadingConversations ? (
                <div className="p-4 text-sm text-muted-foreground">Chargement…</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Aucune conversation.</div>
              ) : (
                <ul className="p-2">
                  {conversations.map((c) => (
                    <li key={c.id}>
                      <Button
                        variant={c.id === activeConversationId ? "secondary" : "ghost"}
                        className="w-full justify-start truncate"
                        onClick={() => { setActiveConversationId(c.id); setSidebarOpen(false); }}
                      >
                        {c.title || "Conversation"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Chat area */}
      <main className="flex-1 flex flex-col">
        {/* Desktop header */}
        <header className="hidden md:flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Bot className="w-6 h-6 text-primary" strokeWidth={1.5} />
            <span className="font-medium text-foreground">AI Assistant</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={startNewConversation}>
              <Plus className="w-4 h-4 mr-1" /> Nouveau
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto animate-fade-in pb-40">
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
                <div className={`max-w-[80%] md:max-w-[65%] ${msg.sender === "bot" ? "order-2" : "order-1"}`}>
                  {msg.sender === "bot" && (
                    <div className="flex items-center space-x-2 mb-1">
                      <Bot className="w-5 h-5 text-primary" strokeWidth={1.5} />
                      <span className="text-xs text-muted-foreground">AI Assistant</span>
                    </div>
                  )}
                  <div className={`p-3 rounded-lg ${msg.sender === "bot" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"}`}>
                    <div className="prose prose-sm max-w-none prose-headings:mt-2 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 prose-a:text-primary prose-invert:prose-strong:font-semibold">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{sanitizeContent(msg.content)}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {sending && (
            <div className="flex justify-start">
              <div className="max-w-[80%] md:max-w-[65%]">
                <div className="flex items-center space-x-2 mb-1">
                  <Bot className="w-5 h-5 text-primary" strokeWidth={1.5} />
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

        {/* Input */}
        <div className="p-4 border-t border-border bg-background sticky bottom-24 md:bottom-0 z-10">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tapez votre message…"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSendMessage())}
              className="flex-1"
              aria-label="Message"
            />
            <Button onClick={handleSendMessage} size="icon" disabled={sending} className="bg-primary hover:bg-primary/90">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" strokeWidth={1.5} />}
            </Button>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Messaging;