import { useState, useEffect, useRef } from 'react';
import { MobileLayout } from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { 
  Heart, Plus, Clock, Check, Bell, Trash2, Play, Pause, 
  RotateCcw, Sparkles, ChevronRight, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface MantraSchedule {
  id: string;
  prayer_name: string;
  scheduled_time: string;
  mantra: string | null;
  duration_minutes: number;
  is_active: boolean;
}

// Hindu Gods/Deities for Naam Jaap
const deities = [
  { name: 'Krishna', mantra: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे', icon: '🙏' },
  { name: 'Shiva', mantra: 'ॐ नमः शिवाय', icon: '🔱' },
  { name: 'Rama', mantra: 'श्री राम जय राम जय जय राम', icon: '🏹' },
  { name: 'Ganesha', mantra: 'ॐ गं गणपतये नमः', icon: '🐘' },
  { name: 'Hanuman', mantra: 'ॐ हनुमते नमः', icon: '🐒' },
  { name: 'Durga', mantra: 'ॐ दुं दुर्गायै नमः', icon: '🌸' },
  { name: 'Lakshmi', mantra: 'ॐ श्रीं महालक्ष्म्यै नमः', icon: '🪷' },
  { name: 'Saraswati', mantra: 'ॐ ऐं सरस्वत्यै नमः', icon: '📿' },
  { name: 'Vishnu', mantra: 'ॐ नमो नारायणाय', icon: '🔵' },
  { name: 'Brahma', mantra: 'ॐ वेदात्मने नमः', icon: '📖' },
];

// Popular mantras for chanting
const popularMantras = [
  { name: 'Gayatri Mantra', text: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्', description: 'Universal prayer for enlightenment' },
  { name: 'Mahamrityunjaya', text: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात्', description: 'For healing and protection' },
  { name: 'Om', text: 'ॐ', description: 'The universal sound' },
  { name: 'Peace Mantra', text: 'ॐ शांति शांति शांति', description: 'For inner peace' },
];

export default function MantraJaap() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [mantras, setMantras] = useState<MantraSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'naam' | 'mantra' | 'schedule'>('naam');
  
  // Naam Jaap state
  const [selectedDeity, setSelectedDeity] = useState<string | null>(null);
  const [isChanting, setIsChanting] = useState(false);
  const [jaapCount, setJaapCount] = useState(0);
  const [targetCount, setTargetCount] = useState(108);
  
  // Mantra schedule state
  const [mantraName, setMantraName] = useState('');
  const [scheduledTime, setScheduledTime] = useState('06:00');
  const [selectedMantra, setSelectedMantra] = useState('');
  const [duration, setDuration] = useState(10);

  const countRef = useRef<HTMLButtonElement>(null);

  // Get user's favorite deity from profile or onboarding
  const favoriteDeity = deities.find(d => d.name === profile?.full_name?.split(' ')[0]) || null;

  useEffect(() => {
    if (user) fetchMantras();
  }, [user]);

  const fetchMantras = async () => {
    const { data, error } = await supabase
      .from('prayer_schedules')
      .select('*')
      .order('scheduled_time', { ascending: true });

    if (!error) setMantras(data || []);
    setLoading(false);
  };

  const handleJaapTap = () => {
    if (jaapCount < targetCount) {
      setJaapCount(prev => prev + 1);
      
      // Vibration feedback if supported
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      if (jaapCount + 1 === targetCount) {
        toast({ title: '🙏 Jaap Complete!', description: `You completed ${targetCount} chants` });
        setIsChanting(false);
      }
    }
  };

  const resetJaap = () => {
    setJaapCount(0);
    setIsChanting(false);
  };

  const startJaap = (deity: typeof deities[0]) => {
    setSelectedDeity(deity.name);
    setSelectedMantra(deity.mantra);
    setIsChanting(true);
    setJaapCount(0);
  };

  const handleAddSchedule = async () => {
    if (!mantraName.trim()) {
      toast({ title: 'Please enter a name', variant: 'destructive' });
      return;
    }

    if (!user) {
      navigate('/auth');
      return;
    }

    const { error } = await supabase.from('prayer_schedules').insert({
      user_id: user.id,
      prayer_name: mantraName.trim(),
      scheduled_time: scheduledTime,
      mantra: selectedMantra || null,
      duration_minutes: duration,
    });

    if (error) {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } else {
      toast({ title: 'Mantra schedule added 🙏' });
      setMantraName('');
      setSelectedMantra('');
      setIsAdding(false);
      fetchMantras();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('prayer_schedules').update({ is_active: !current }).eq('id', id);
    fetchMantras();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('prayer_schedules').delete().eq('id', id);
    toast({ title: 'Schedule removed' });
    fetchMantras();
  };

  const markCompleted = async (scheduleId: string) => {
    if (!user) return;
    await supabase.from('completed_prayers').insert({
      user_id: user.id,
      prayer_schedule_id: scheduleId,
    });
    toast({ title: 'Mantra session completed 🙏' });
  };

  if (!user) {
    return (
      <MobileLayout currentPage="/mantra-jaap">
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Heart className="h-16 w-16 text-saffron mb-4" />
          <h2 className="text-xl font-display mb-2">Mantra Jaap</h2>
          <p className="text-muted-foreground mb-6">Sign in to start your chanting practice</p>
          <Button variant="saffron" onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="/mantra-jaap">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-saffron p-2 rounded-full">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-display">Mantra Jaap</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          {[
            { id: 'naam', label: 'Naam Jaap' },
            { id: 'mantra', label: 'Mantras' },
            { id: 'schedule', label: 'Schedule' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-gradient-saffron text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Naam Jaap Tab */}
        {selectedTab === 'naam' && (
          <div className="space-y-4">
            {isChanting ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Chanting Interface */}
                <Card className="card-3d p-6 text-center">
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">Chanting for</p>
                    <h2 className="text-2xl font-display text-saffron">{selectedDeity}</h2>
                  </div>
                  
                  <div className="bg-gradient-to-br from-saffron/20 to-dharma/20 p-4 rounded-xl mb-6">
                    <p className="text-lg leading-relaxed">{selectedMantra}</p>
                  </div>

                  {/* Counter */}
                  <button
                    ref={countRef}
                    onClick={handleJaapTap}
                    className="w-40 h-40 mx-auto rounded-full bg-gradient-saffron flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                  >
                    <div className="text-center">
                      <p className="text-5xl font-display text-primary-foreground">{jaapCount}</p>
                      <p className="text-sm text-primary-foreground/70">/ {targetCount}</p>
                    </div>
                  </button>
                  
                  <p className="mt-4 text-muted-foreground text-sm">Tap to count</p>

                  {/* Progress */}
                  <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-saffron"
                      initial={{ width: 0 }}
                      animate={{ width: `${(jaapCount / targetCount) * 100}%` }}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <Button variant="outline" className="flex-1" onClick={resetJaap}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset
                    </Button>
                    <Button variant="saffron" className="flex-1" onClick={() => setIsChanting(false)}>
                      <Check className="h-4 w-4 mr-2" />
                      Done
                    </Button>
                  </div>
                </Card>

                {/* Target selector */}
                <Card className="card-3d-subtle p-4">
                  <p className="text-sm text-muted-foreground mb-2">Target Count</p>
                  <div className="flex gap-2">
                    {[27, 54, 108, 216, 1008].map((count) => (
                      <button
                        key={count}
                        onClick={() => setTargetCount(count)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                          targetCount === count
                            ? 'bg-saffron text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Select a deity to start Naam Jaap
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {deities.map((deity) => (
                    <button
                      key={deity.name}
                      onClick={() => startJaap(deity)}
                      className="p-4 rounded-xl bg-card border border-border hover:border-saffron/50 transition-all text-left"
                    >
                      <span className="text-3xl mb-2 block">{deity.icon}</span>
                      <p className="font-medium text-foreground">{deity.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{deity.mantra}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mantras Tab */}
        {selectedTab === 'mantra' && (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Powerful mantras for spiritual practice
            </p>
            
            {popularMantras.map((mantra) => (
              <Card key={mantra.name} className="card-3d-subtle p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-display text-foreground">{mantra.name}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{mantra.description}</p>
                    <p className="text-sm text-saffron">{mantra.text}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="saffron"
                    onClick={() => {
                      setSelectedMantra(mantra.text);
                      setSelectedDeity(mantra.name);
                      setIsChanting(true);
                      setSelectedTab('naam');
                    }}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Schedule Tab */}
        {selectedTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">Your mantra schedules</p>
              {!isAdding && (
                <Button variant="saffron" size="sm" onClick={() => setIsAdding(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              )}
            </div>

            {isAdding && (
              <Card className="card-3d-subtle p-4 space-y-4">
                <h3 className="font-medium">Add Schedule</h3>
                
                <Input
                  placeholder="Schedule name"
                  value={mantraName}
                  onChange={(e) => setMantraName(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">Time</label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Duration (min)</label>
                    <Input
                      type="number"
                      min={5}
                      max={60}
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 10)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Select Mantra</label>
                  <div className="space-y-2">
                    {popularMantras.slice(0, 3).map((m) => (
                      <button
                        key={m.name}
                        onClick={() => setSelectedMantra(m.text)}
                        className={`w-full p-2 rounded-lg text-left text-xs transition-all ${
                          selectedMantra === m.text 
                            ? 'bg-saffron/20 border border-saffron' 
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        <div className="font-medium">{m.name}</div>
                        <div className="text-muted-foreground truncate">{m.text}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                  <Button variant="saffron" className="flex-1" onClick={handleAddSchedule}>
                    Add
                  </Button>
                </div>
              </Card>
            )}

            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : mantras.length === 0 ? (
              <Card className="card-3d-subtle p-6 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No schedules yet</p>
                <p className="text-sm text-muted-foreground">Add a mantra schedule to get reminders</p>
              </Card>
            ) : (
              mantras.map((schedule) => (
                <Card key={schedule.id} className={`card-3d-subtle p-4 ${!schedule.is_active ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{schedule.prayer_name}</h4>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {schedule.scheduled_time}
                        </span>
                      </div>
                      {schedule.mantra && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{schedule.mantra}</p>
                      )}
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="saffron" onClick={() => markCompleted(schedule.id)}>
                          <Check className="h-3 w-3 mr-1" /> Complete
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => toggleActive(schedule.id, schedule.is_active)}
                      >
                        <Bell className={`h-4 w-4 ${schedule.is_active ? 'text-saffron' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(schedule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
