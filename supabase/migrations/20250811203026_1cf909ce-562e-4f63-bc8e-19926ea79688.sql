-- Conversations and Messages schema for chat history (retry without IF NOT EXISTS)

-- Create conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.conversations
FOR DELETE
USING (auth.uid() = user_id);

-- Timestamp trigger on update
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful index for listing conversations by recency per user
CREATE INDEX idx_conversations_user_updated_at
ON public.conversations (user_id, updated_at DESC);


-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user','bot')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages, scoped via conversation ownership
CREATE POLICY "Users can view messages of their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages into their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages of their conversations"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages of their conversations"
ON public.messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND c.user_id = auth.uid()
  )
);

-- Index for efficient fetch of conversation messages
CREATE INDEX idx_messages_conversation_id_created_at
ON public.messages (conversation_id, created_at);

-- Touch conversations.updated_at when a new message arrives
CREATE OR REPLACE FUNCTION public.touch_conversation_updated_at()
RETURNS trigger AS $$
BEGIN
  UPDATE public.conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER touch_conversations_updated_at_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_conversation_updated_at();