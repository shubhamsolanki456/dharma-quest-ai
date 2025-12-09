import { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Plus, Clock, Check, Bell, Trash2, Play, Pause } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface PrayerSchedule {
  id: string;
  prayer_name: string;
  scheduled_time: string;
  mantra: string | null;
  duration_minutes: number;
  is_active: boolean;
}

const defaultPrayers = [
  { name: 'Morning Sandhya', time: '06:00', mantra: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्', duration: 15 },
  { name: 'Noon Prayer', time: '12:00', mantra: 'ॐ नमः शिवाय', duration: 10 },
  { name: 'Evening Aarti', time: '18:30', mantra: 'ॐ जय जगदीश हरे', duration: 15 },
  { name: 'Night Prayer', time: '21:00', mantra: 'ॐ शांति शांति शांति', duration: 10 },
];

const mantras = [
  { name: 'Gayatri Mantra', text: 'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्' },
  { name: 'Mahamrityunjaya Mantra', text: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम् उर्वारुकमिव बन्धनान्मृत्योर्मुक्षीय मामृतात्' },
  { name: 'Om Namah Shivaya', text: 'ॐ नमः शिवाय' },
  { name: 'Hare Krishna Mantra', text: 'हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे हरे राम हरे राम राम राम हरे हरे' },
];

export default function Prayers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [prayers, setPrayers] = useState<PrayerSchedule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [prayerName, setPrayerName] = useState('');
  const [scheduledTime, setScheduledTime] = useState('06:00');
  const [mantra, setMantra] = useState('');
  const [duration, setDuration] = useState(10);
  const [activeChant, setActiveChant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchPrayers();
  }, [user]);

  const fetchPrayers = async () => {
    const { data, error } = await supabase
      .from('prayer_schedules')
      .select('*')
      .order('scheduled_time', { ascending: true });

    if (!error) setPrayers(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!prayerName.trim()) {
      toast({ title: 'Please enter a prayer name', variant: 'destructive' });
      return;
    }

    if (!user) {
      navigate('/auth');
      return;
    }

    const { error } = await supabase.from('prayer_schedules').insert({
      user_id: user.id,
      prayer_name: prayerName.trim(),
      scheduled_time: scheduledTime,
      mantra: mantra || null,
      duration_minutes: duration,
    });

    if (error) {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } else {
      toast({ title: 'Prayer scheduled 🙏' });
      setPrayerName('');
      setMantra('');
      setIsAdding(false);
      fetchPrayers();
    }
  };

  const handleAddQuick = async (prayer: typeof defaultPrayers[0]) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const { error } = await supabase.from('prayer_schedules').insert({
      user_id: user.id,
      prayer_name: prayer.name,
      scheduled_time: prayer.time,
      mantra: prayer.mantra,
      duration_minutes: prayer.duration,
    });

    if (!error) {
      toast({ title: `${prayer.name} added 🙏` });
      fetchPrayers();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('prayer_schedules').update({ is_active: !current }).eq('id', id);
    fetchPrayers();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('prayer_schedules').delete().eq('id', id);
    toast({ title: 'Prayer removed' });
    fetchPrayers();
  };

  const markCompleted = async (prayerId: string) => {
    if (!user) return;
    await supabase.from('completed_prayers').insert({
      user_id: user.id,
      prayer_schedule_id: prayerId,
    });
    toast({ title: 'Prayer completed 🙏' });
  };

  if (!user) {
    return (
      <MobileLayout currentPage="/prayers">
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Heart className="h-16 w-16 text-red-400 mb-4" />
          <h2 className="text-xl font-display mb-2">Daily Prayers</h2>
          <p className="text-muted-foreground mb-6">Sign in to set up your prayer schedule</p>
          <Button variant="saffron" onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="/prayers">
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-red-400" />
            <h1 className="text-xl font-display">Daily Prayers</h1>
          </div>
          {!isAdding && (
            <Button variant="saffron" size="sm" onClick={() => setIsAdding(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          )}
        </div>

        {/* Quick Add Suggestions */}
        {prayers.length === 0 && !isAdding && (
          <Card className="card-3d-subtle p-4 space-y-3">
            <h3 className="font-medium text-sm">Suggested Prayers</h3>
            <div className="space-y-2">
              {defaultPrayers.map((prayer) => (
                <button
                  key={prayer.name}
                  onClick={() => handleAddQuick(prayer)}
                  className="w-full p-3 rounded-lg bg-muted hover:bg-muted/80 text-left transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{prayer.name}</span>
                    <span className="text-xs text-muted-foreground">{prayer.time}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {isAdding && (
          <Card className="card-3d-subtle p-4 space-y-4">
            <h3 className="font-medium">Add Prayer</h3>
            
            <Input
              placeholder="Prayer name"
              value={prayerName}
              onChange={(e) => setPrayerName(e.target.value)}
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
                {mantras.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => setMantra(m.text)}
                    className={`w-full p-2 rounded-lg text-left text-xs transition-all ${
                      mantra === m.text ? 'bg-saffron/20 border border-saffron' : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    <div className="font-medium">{m.name}</div>
                    <div className="text-muted-foreground truncate">{m.text}</div>
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              placeholder="Or write custom mantra..."
              value={mantra}
              onChange={(e) => setMantra(e.target.value)}
              className="min-h-[60px]"
            />

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button variant="saffron" className="flex-1" onClick={handleAdd}>Add Prayer</Button>
            </div>
          </Card>
        )}

        {/* Prayer List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : prayers.length > 0 && (
            prayers.map((prayer) => (
              <Card key={prayer.id} className={`card-3d-subtle p-4 ${!prayer.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{prayer.prayer_name}</h4>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {prayer.scheduled_time}
                      </span>
                    </div>
                    {prayer.mantra && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{prayer.mantra}</p>
                    )}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="saffron" onClick={() => markCompleted(prayer.id)}>
                        <Check className="h-3 w-3 mr-1" /> Complete
                      </Button>
                      {prayer.mantra && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveChant(activeChant === prayer.id ? null : prayer.id)}
                        >
                          {activeChant === prayer.id ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          {activeChant === prayer.id ? 'Stop' : 'Chant'}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleActive(prayer.id, prayer.is_active)}
                    >
                      <Bell className={`h-4 w-4 ${prayer.is_active ? 'text-saffron' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(prayer.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Expanded Mantra Chanting View */}
                {activeChant === prayer.id && prayer.mantra && (
                  <div className="mt-4 p-4 bg-spiritual-blue/20 rounded-lg text-center">
                    <p className="text-lg leading-relaxed animate-pulse">{prayer.mantra}</p>
                    <p className="text-xs text-muted-foreground mt-2">Chant with devotion 🙏</p>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
