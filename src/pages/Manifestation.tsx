import { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Plus, Check, Star, Target, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Manifestation {
  id: string;
  intention: string;
  category: string | null;
  target_date: string | null;
  is_achieved: boolean;
  gratitude_notes: string | null;
  created_at: string;
}

const categories = [
  { value: 'spiritual', label: 'Spiritual Growth', emoji: '🙏' },
  { value: 'health', label: 'Health & Wellness', emoji: '💪' },
  { value: 'relationships', label: 'Relationships', emoji: '❤️' },
  { value: 'abundance', label: 'Abundance', emoji: '✨' },
  { value: 'career', label: 'Career & Purpose', emoji: '🎯' },
  { value: 'peace', label: 'Inner Peace', emoji: '☮️' },
];

export default function Manifestation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [manifestations, setManifestations] = useState<Manifestation[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [intention, setIntention] = useState('');
  const [category, setCategory] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchManifestations();
  }, [user]);

  const fetchManifestations = async () => {
    const { data, error } = await supabase
      .from('manifestations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setManifestations(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!intention.trim()) {
      toast({ title: 'Please enter your intention', variant: 'destructive' });
      return;
    }

    if (!user) {
      toast({ title: 'Please sign in', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    const { error } = await supabase.from('manifestations').insert({
      user_id: user.id,
      intention: intention.trim(),
      category: category || null,
      target_date: targetDate || null,
    });

    if (error) {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } else {
      toast({ title: 'Intention set ✨' });
      setIntention('');
      setCategory('');
      setTargetDate('');
      setIsAdding(false);
      fetchManifestations();
    }
  };

  const toggleAchieved = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('manifestations')
      .update({
        is_achieved: !currentStatus,
        achieved_at: !currentStatus ? new Date().toISOString() : null,
      })
      .eq('id', id);

    if (!error) {
      if (!currentStatus) {
        toast({ title: 'Congratulations! 🎉', description: 'Your manifestation has come true!' });
      }
      fetchManifestations();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('manifestations').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Intention removed' });
      fetchManifestations();
    }
  };

  const activeManifestations = manifestations.filter(m => !m.is_achieved);
  const achievedManifestations = manifestations.filter(m => m.is_achieved);

  if (!user) {
    return (
      <MobileLayout currentPage="/manifestation">
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Sparkles className="h-16 w-16 text-dharma mb-4" />
          <h2 className="text-xl font-display mb-2">Manifestation Board</h2>
          <p className="text-muted-foreground mb-6">Sign in to set your spiritual intentions</p>
          <Button variant="saffron" onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="/manifestation">
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-dharma" />
            <h1 className="text-xl font-display">Manifestation</h1>
          </div>
          {!isAdding && (
            <Button variant="saffron" size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          )}
        </div>

        {isAdding && (
          <Card className="card-3d-subtle p-4 space-y-4">
            <h3 className="font-medium">Set Your Intention</h3>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 transition-all ${
                      category === cat.value
                        ? 'bg-dharma text-background'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              <Textarea
                placeholder="I am manifesting..."
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                className="min-h-[100px]"
              />

              <div>
                <label className="text-sm text-muted-foreground">Target Date (optional)</label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAdding(false)}>
                Cancel
              </Button>
              <Button variant="saffron" className="flex-1" onClick={handleAdd}>
                Set Intention ✨
              </Button>
            </div>
          </Card>
        )}

        {/* Active Intentions */}
        <div className="space-y-3">
          <h3 className="text-sm text-muted-foreground flex items-center gap-2">
            <Target className="h-4 w-4" /> Active Intentions ({activeManifestations.length})
          </h3>
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : activeManifestations.length === 0 ? (
            <Card className="card-3d-subtle p-6 text-center">
              <Star className="h-10 w-10 text-dharma mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Set your first intention to begin manifesting</p>
            </Card>
          ) : (
            activeManifestations.map((m) => (
              <Card key={m.id} className="card-3d-subtle p-4">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleAchieved(m.id, m.is_achieved)}
                    className="mt-1 h-5 w-5 rounded-full border-2 border-dharma flex items-center justify-center hover:bg-dharma/20 transition-all"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{m.intention}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {m.category && (
                        <span className="px-2 py-0.5 bg-muted rounded-full">
                          {categories.find(c => c.value === m.category)?.emoji}
                        </span>
                      )}
                      {m.target_date && <span>Target: {format(new Date(m.target_date), 'MMM d, yyyy')}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Achieved */}
        {achievedManifestations.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm text-muted-foreground flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" /> Manifested ({achievedManifestations.length})
            </h3>
            {achievedManifestations.map((m) => (
              <Card key={m.id} className="card-3d-subtle p-4 opacity-75">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleAchieved(m.id, m.is_achieved)}
                    className="mt-1 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center"
                  >
                    <Check className="h-3 w-3 text-background" />
                  </button>
                  <div className="flex-1">
                    <p className="font-medium line-through">{m.intention}</p>
                    <span className="text-xs text-muted-foreground">
                      {categories.find(c => c.value === m.category)?.emoji}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
