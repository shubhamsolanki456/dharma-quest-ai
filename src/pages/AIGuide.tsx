import { useState, useRef, useEffect } from 'react';
import { MobileLayout } from '@/components/MobileLayout';
import { DharmaCard } from '@/components/DharmaCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, BookOpen, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RobotIcon } from '@/components/icons';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  scripture?: string;
  source?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-scripture-chat`;

const AIGuide = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Namaste! I'm your AI spiritual guide. Ask me anything about Hindu scriptures, life dilemmas, or spiritual practices. I'll provide guidance with authentic references from our sacred texts.",
      isUser: false,
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "How can I overcome anger?",
    "What is dharma?",
    "How to practice meditation?",
    "Meaning of Om?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Prepare messages for the API
      const apiMessages = messages
        .filter(m => m.id !== 1) // Exclude initial greeting
        .map(m => ({
          role: m.isUser ? 'user' : 'assistant',
          content: m.text
        }));
      
      apiMessages.push({ role: 'user', content: currentInput });

      const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (response.status === 429) {
        toast({ title: 'Too many requests. Please wait a moment.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      if (response.status === 402) {
        toast({ title: 'Please add credits to continue using AI features.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response');
      }

      // Process streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      let textBuffer = '';
      const assistantId = messages.length + 2;

      // Add empty assistant message
      setMessages(prev => [...prev, { id: assistantId, text: '', isUser: false }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              setMessages(prev => 
                prev.map(m => m.id === assistantId ? { ...m, text: assistantText } : m)
              );
            }
          } catch {
            // Incomplete JSON, put it back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw || raw.startsWith(':') || !raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantText += content;
              setMessages(prev => 
                prev.map(m => m.id === assistantId ? { ...m, text: assistantText } : m)
              );
            }
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast({ 
        title: 'Failed to get response', 
        description: 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  return (
    <MobileLayout currentPage="/ai-guide">
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        {/* Header - Orange container with robot icon */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-saffron p-2.5 rounded-xl flex items-center justify-center">
              <RobotIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Spiritual Guide</h1>
              <p className="text-sm text-muted-foreground">Wisdom from sacred texts</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${message.isUser ? 'order-2' : 'order-1'}`}>
                <DharmaCard 
                  className={`p-3 ${message.isUser ? 'bg-saffron text-white' : ''}`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  {message.scripture && (
                    <div className="mt-3 p-3 bg-background/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="text-xs font-medium">Scripture</span>
                      </div>
                      <p className="text-sm italic mb-1">{message.scripture}</p>
                      <p className="text-xs opacity-75">- {message.source}</p>
                    </div>
                  )}
                </DharmaCard>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.isUser && (
            <div className="flex justify-start">
              <DharmaCard className="p-3">
                <Loader2 className="h-5 w-5 animate-spin text-saffron" />
              </DharmaCard>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <div className="p-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">Try asking:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion(question)}
                  className="text-xs h-auto py-2 px-3"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about dharma, scriptures, or life guidance..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              variant="saffron" 
              size="icon"
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default AIGuide;
