import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { 
  User, 
  Power, 
  Menu,
  Send,
  Bot,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Messaging = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Bonjour ! Je suis votre assistant IA Savistas. Comment puis-je vous aider avec vos révisions aujourd'hui ?",
      isAI: true,
      timestamp: "10:30"
    },
    {
      id: 2,
      text: "Salut ! J'ai des difficultés avec les fonctions affines, peux-tu m'expliquer ?",
      isAI: false,
      timestamp: "10:31"
    },
    {
      id: 3,
      text: "Bien sûr ! Une fonction affine est une fonction de la forme f(x) = ax + b où a et b sont des constantes. Le coefficient 'a' détermine la pente de la droite, et 'b' l'ordonnée à l'origine. Voulez-vous que je vous donne des exemples concrets ?",
      isAI: true,
      timestamp: "10:32"
    }
  ]);

  const suggestedQuestions = [
    "Explique-moi les fonctions affines",
    "Comment résoudre une équation du second degré ?",
    "Quelles sont les propriétés des triangles ?",
    "Aide-moi avec la conjugaison des verbes"
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: message,
        isAI: false,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...messages, newMessage]);
      setMessage("");
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          text: "Merci pour votre question ! Je vais vous aider avec cela...",
          isAI: true,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bot className="w-8 h-8 text-primary" strokeWidth={1.5} />
            <Zap className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400" strokeWidth={2} />
          </div>
          <span className="font-medium text-foreground">AI Assistant</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Power className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="sm">
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </Button>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto animate-fade-in">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.isAI ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`max-w-[80%] md:max-w-[60%] ${
              msg.isAI ? 'order-2' : 'order-1'
            }`}>
              {msg.isAI && (
                <div className="flex items-center space-x-2 mb-1">
                  <div className="relative">
                    <Bot className="w-5 h-5 text-primary" strokeWidth={1.5} />
                    <Zap className="w-2 h-2 absolute -top-0.5 -right-0.5 text-yellow-400" strokeWidth={2} />
                  </div>
                  <span className="text-xs text-muted-foreground">AI Assistant</span>
                </div>
              )}
              <div className={`p-3 rounded-lg ${
                msg.isAI 
                  ? 'bg-muted text-foreground' 
                  : 'bg-primary text-primary-foreground'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
              <div className={`text-xs text-muted-foreground mt-1 ${
                msg.isAI ? 'text-left' : 'text-right'
              }`}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggested Questions */}
      {messages.length <= 3 && (
        <div className="p-4 border-t border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Questions suggérées :
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-left justify-start h-auto p-3 border-border hover:bg-muted"
                onClick={() => setMessage(question)}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-border pb-24">
        <div className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tapez votre message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            size="icon"
            className="bg-primary hover:bg-primary/90"
          >
            <Send className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Messaging;