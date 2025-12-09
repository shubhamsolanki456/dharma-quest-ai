import { useState, useRef } from "react";
import { MobileLayout } from "@/components/MobileLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Share2, Heart, Volume2, Square, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { ShareModal } from "@/components/ShareModal";
import { shlokas, getTodaysShloka } from "@/data/shlokas";

const DailyShlok = () => {
  const [liked, setLiked] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const todayShlok = getTodaysShloka(shlokas);

  const speakShlok = () => {
    if (isSpeaking) {
      // Stop speaking
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      toast.error("Text-to-speech not supported in this browser");
      return;
    }

    // Create the text to speak - Sanskrit followed by translation
    const textToSpeak = `${todayShlok.sanskrit}. ${todayShlok.translation}`;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utteranceRef.current = utterance;
    
    // Try to find a Hindi voice for better Sanskrit pronunciation
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(voice => 
      voice.lang.includes('hi') || voice.lang.includes('HI') || voice.name.includes('Hindi')
    );
    const googleVoice = voices.find(voice => voice.name.includes('Google'));
    
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    } else if (googleVoice) {
      utterance.voice = googleVoice;
    }
    
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error("Error playing audio");
    };
    
    window.speechSynthesis.speak(utterance);
  };

  // Load voices on mount (needed for some browsers)
  useState(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  });

  return (
    <MobileLayout currentPage="/daily-shlok">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="text-center py-4">
          <div className="bg-gradient-saffron p-3 rounded-full w-fit mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display mb-2">Daily Shlok</h1>
          <p className="text-muted-foreground">
            Bhagavad Gita Chapter {todayShlok.chapter}, Verse {todayShlok.verse}
          </p>
        </div>

        {/* Sanskrit Verse */}
        <Card className="p-6 bg-gradient-to-br from-saffron/10 to-spiritual/10 border-saffron/20">
          <p className="text-lg text-center leading-relaxed text-foreground font-medium">
            {todayShlok.sanskrit}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${isSpeaking ? 'text-red-500' : 'text-saffron'}`}
              onClick={speakShlok}
            >
              {isSpeaking ? (
                <>
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-1" />
                  Listen
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Transliteration */}
        <Card className="p-4">
          <h3 className="font-display text-sm text-muted-foreground mb-2">Transliteration</h3>
          <p className="text-foreground italic">{todayShlok.transliteration}</p>
        </Card>

        {/* Translation */}
        <Card className="p-4">
          <h3 className="font-display text-sm text-muted-foreground mb-2">Translation</h3>
          <p className="text-foreground">{todayShlok.translation}</p>
        </Card>

        {/* Deep Explanation */}
        <Card className="p-4 bg-gradient-to-br from-spiritual/5 to-lotus/5 border-spiritual/20">
          <h3 className="font-display text-spiritual mb-3">Deep Meaning</h3>
          <p className="text-muted-foreground leading-relaxed">{todayShlok.explanation}</p>
        </Card>

        {/* Practical Applications */}
        <Card className="p-4">
          <h3 className="font-display mb-3">How to Apply Today</h3>
          <div className="space-y-3">
            {todayShlok.practicalApplication.map((tip, index) => (
              <div key={index} className="flex items-start gap-3">
                <ChevronRight className="h-4 w-4 text-saffron mt-1 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{tip}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Related Concepts */}
        <Card className="p-4">
          <h3 className="font-display mb-3">Related Concepts</h3>
          <div className="flex flex-wrap gap-2">
            {todayShlok.relatedConcepts.map((concept, index) => (
              <span 
                key={index} 
                className="px-3 py-1 bg-saffron/10 text-saffron text-sm rounded-full"
              >
                {concept}
              </span>
            ))}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setLiked(!liked)}
          >
            <Heart className={`h-4 w-4 mr-2 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            {liked ? 'Saved' : 'Save'}
          </Button>
          <Button variant="saffron" className="flex-1" onClick={() => setShowShareModal(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title={`Bhagavad Gita ${todayShlok.chapter}.${todayShlok.verse}`}
          text={`${todayShlok.sanskrit}\n\n"${todayShlok.translation}"\n\n- Bhagavad Gita`}
        />
      </div>
    </MobileLayout>
  );
};

export default DailyShlok;
