import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MobileLayout } from '@/components/MobileLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Mic, MicOff, Play, Pause, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface VoiceLogEntry {
  id: string;
  title: string | null;
  audio_url: string;
  duration_seconds: number | null;
  log_type: string;
  created_at: string;
}

const logTypes = [
  { value: 'reflection', label: 'Daily Reflection', emoji: '🙏' },
  { value: 'confession', label: 'Sin Confession', emoji: '🔥' },
  { value: 'gratitude', label: 'Gratitude', emoji: '💖' },
  { value: 'prayer', label: 'Prayer', emoji: '🙏' },
];

export default function VoiceLog() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [logs, setLogs] = useState<VoiceLogEntry[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedType, setSelectedType] = useState('reflection');
  const [title, setTitle] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) fetchLogs();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [user]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('voice_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setLogs(data || []);
    setLoading(false);
  };

  const startRecording = async () => {
    try {
      setAudioError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await saveRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Microphone error:', error);
      toast({ title: 'Microphone access denied', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const saveRecording = async (audioBlob: Blob) => {
    if (!user) {
      toast({ title: 'Please sign in', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    const fileName = `${user.id}/${Date.now()}.webm`;
    
    const { error: uploadError } = await supabase.storage
      .from('voice-recordings')
      .upload(fileName, audioBlob, {
        contentType: 'audio/webm',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast({ title: 'Failed to upload recording', variant: 'destructive' });
      return;
    }

    const { data: urlData } = supabase.storage
      .from('voice-recordings')
      .getPublicUrl(fileName);

    const { error } = await supabase.from('voice_logs').insert({
      user_id: user.id,
      title: title || null,
      audio_url: urlData.publicUrl,
      duration_seconds: recordingTime,
      log_type: selectedType,
    });

    if (error) {
      console.error('Save error:', error);
      toast({ title: 'Failed to save log', variant: 'destructive' });
    } else {
      toast({ title: 'Voice log saved 🎙️' });
      setTitle('');
      setRecordingTime(0);
      fetchLogs();
    }
  };

  const playAudio = async (url: string, id: string) => {
    setAudioError(null);
    
    if (playingId === id) {
      // Pause current audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      return;
    }

    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      const audio = new Audio();
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setAudioError('Failed to play audio. The recording may be corrupted.');
        setPlayingId(null);
      };

      audio.onended = () => {
        setPlayingId(null);
      };

      audio.oncanplaythrough = () => {
        audio.play().catch(err => {
          console.error('Play error:', err);
          setAudioError('Failed to play audio');
          setPlayingId(null);
        });
      };

      audio.src = url;
      audioRef.current = audio;
      setPlayingId(id);
      
    } catch (error) {
      console.error('Audio init error:', error);
      setAudioError('Failed to initialize audio player');
      setPlayingId(null);
    }
  };

  const handleDelete = async (id: string, audioUrl: string) => {
    // Extract file path from URL
    const urlParts = audioUrl.split('/voice-recordings/');
    if (urlParts.length > 1) {
      const filePath = urlParts[1];
      await supabase.storage.from('voice-recordings').remove([filePath]);
    }

    const { error } = await supabase.from('voice_logs').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Recording deleted' });
      fetchLogs();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <MobileLayout currentPage="/voice-log">
        <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Mic className="h-16 w-16 text-saffron mb-4" />
          <h2 className="text-xl font-display mb-2">Voice Log</h2>
          <p className="text-muted-foreground mb-6">Sign in to record your spiritual reflections</p>
          <Button className="bg-gradient-saffron text-primary-foreground" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout currentPage="/voice-log">
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3">
          <Mic className="h-6 w-6 text-saffron" />
          <h1 className="text-xl font-display">Voice Log</h1>
        </div>

        {/* Error Display */}
        <AnimatePresence>
          {audioError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 flex items-start gap-2"
            >
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-destructive">{audioError}</p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-destructive p-0 h-auto mt-1"
                  onClick={() => setAudioError(null)}
                >
                  Dismiss
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording Section */}
        <motion.div 
          className="card-3d rounded-2xl p-6 space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap gap-2">
            {logTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1 transition-all ${
                  selectedType === type.value
                    ? 'bg-gradient-saffron text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
              >
                <span>{type.emoji}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          <Input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-secondary border-border"
          />

          <div className="flex flex-col items-center space-y-4">
            {/* Recording Timer */}
            <AnimatePresence>
              {isRecording && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-4xl font-display text-saffron"
                >
                  <span className="animate-pulse">{formatTime(recordingTime)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Record Button */}
            <motion.button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isRecording
                  ? 'bg-destructive'
                  : 'bg-gradient-saffron'
              }`}
              whileTap={{ scale: 0.95 }}
              animate={isRecording ? { scale: [1, 1.05, 1] } : {}}
              transition={isRecording ? { repeat: Infinity, duration: 1 } : {}}
            >
              {isRecording ? (
                <MicOff className="h-8 w-8 text-destructive-foreground" />
              ) : (
                <Mic className="h-8 w-8 text-primary-foreground" />
              )}
            </motion.button>
            <span className="text-sm text-muted-foreground">
              {isRecording ? 'Tap to stop' : 'Tap to record'}
            </span>
          </div>
        </motion.div>

        {/* Recordings List */}
        <div className="space-y-3">
          <h3 className="text-sm text-muted-foreground">Your Recordings</h3>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron mx-auto"></div>
            </div>
          ) : logs.length === 0 ? (
            <motion.div 
              className="card-3d-subtle rounded-xl p-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Mic className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No recordings yet</p>
              <p className="text-xs text-muted-foreground mt-1">Record your first spiritual reflection above</p>
            </motion.div>
          ) : (
            logs.map((log, index) => (
              <motion.div 
                key={log.id} 
                className="card-3d-subtle rounded-xl p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <motion.button
                      onClick={() => playAudio(log.audio_url, log.id)}
                      className={`h-12 w-12 rounded-full flex items-center justify-center transition-all ${
                        playingId === log.id ? 'bg-gradient-saffron' : 'bg-muted hover:bg-muted/80'
                      }`}
                      whileTap={{ scale: 0.95 }}
                    >
                      {playingId === log.id ? (
                        <Pause className="h-5 w-5 text-primary-foreground" />
                      ) : (
                        <Play className="h-5 w-5 text-foreground" />
                      )}
                    </motion.button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {logTypes.find(t => t.value === log.log_type)?.emoji}
                        </span>
                        <span className="font-medium text-sm text-foreground">
                          {log.title || logTypes.find(t => t.value === log.log_type)?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(log.created_at), 'MMM d')}
                        </span>
                        {log.duration_seconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(log.duration_seconds)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(log.id, log.audio_url)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}