import { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PenLine, Plus, ArrowLeft, Trash2, Calendar, Heart, Sparkles, Sun } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface JournalEntry {
  id: string;
  title: string | null;
  content: string;
  mood: string | null;
  created_at: string;
}

const moods = [
  { emoji: '🙏', label: 'Grateful', value: 'grateful' },
  { emoji: '☮️', label: 'Peaceful', value: 'peaceful' },
  { emoji: '🌟', label: 'Inspired', value: 'inspired' },
  { emoji: '🧘', label: 'Reflective', value: 'reflective' },
  { emoji: '💪', label: 'Strong', value: 'strong' },
  { emoji: '🌙', label: 'Calm', value: 'calm' },
];

export default function Journal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entries:', error);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast({ title: 'Please write something', variant: 'destructive' });
      return;
    }

    if (!user) {
      toast({ title: 'Please sign in to save entries', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    const { error } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      title: title.trim() || null,
      content: content.trim(),
      mood: selectedMood || null,
    });

    if (error) {
      toast({ title: 'Failed to save entry', variant: 'destructive' });
    } else {
      toast({ title: 'Entry saved 🙏' });
      setTitle('');
      setContent('');
      setSelectedMood('');
      setIsWriting(false);
      fetchEntries();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    if (error) {
      toast({ title: 'Failed to delete entry', variant: 'destructive' });
    } else {
      toast({ title: 'Entry deleted' });
      fetchEntries();
    }
  };

  const prompts = [
    "What am I grateful for today?",
    "How did I serve others today?",
    "What lesson did the universe teach me?",
    "Where did I feel divine presence?",
    "What negative thought patterns did I notice?"
  ];

  if (!user) {
    return (
      <MobileLayout currentPage="/journal">
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <PenLine className="h-16 w-16 text-saffron mb-4" />
          <h2 className="text-xl font-display mb-2">Spiritual Journal</h2>
          <p className="text-muted-foreground mb-6">Sign in to start your spiritual journaling practice</p>
          <Button variant="saffron" onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="/journal">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <PenLine className="h-6 w-6 text-saffron" />
            <h1 className="text-xl font-display">Spiritual Journal</h1>
          </div>
          {!isWriting && (
            <Button variant="saffron" size="sm" onClick={() => setIsWriting(true)}>
              <Plus className="h-4 w-4 mr-1" /> New Entry
            </Button>
          )}
        </div>

        {isWriting ? (
          <Card className="card-3d-subtle p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setIsWriting(false)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <span className="text-sm text-muted-foreground">
                {format(new Date(), 'MMM d, yyyy')}
              </span>
            </div>

            <Input
              placeholder="Entry title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium"
            />

            {/* Mood Selection */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">How are you feeling?</p>
              <div className="flex flex-wrap gap-2">
                {moods.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setSelectedMood(mood.value)}
                    className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-all ${
                      selectedMood === mood.value
                        ? 'bg-saffron text-background'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <span>{mood.emoji}</span>
                    <span>{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Writing Prompts */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">Reflection prompts:</p>
              <div className="flex overflow-x-auto gap-2 pb-2">
                {prompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setContent(prompt + '\n\n')}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs bg-spiritual-blue/30 hover:bg-spiritual-blue/50 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Write your spiritual reflections here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none"
            />

            <Button variant="saffron" className="w-full" onClick={handleSave}>
              Save Entry 🙏
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : entries.length === 0 ? (
              <Card className="card-3d-subtle p-8 text-center">
                <Sparkles className="h-12 w-12 text-dharma mx-auto mb-4" />
                <h3 className="font-display text-lg mb-2">Start Your Journey</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Begin documenting your spiritual growth and reflections
                </p>
                <Button variant="saffron" onClick={() => setIsWriting(true)}>
                  Write First Entry
                </Button>
              </Card>
            ) : (
              entries.map((entry) => (
                <Card key={entry.id} className="card-3d-subtle p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{entry.title || 'Untitled Entry'}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(entry.created_at), 'MMM d, yyyy • h:mm a')}
                        {entry.mood && (
                          <span className="px-2 py-0.5 bg-muted rounded-full">
                            {moods.find(m => m.value === entry.mood)?.emoji}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
