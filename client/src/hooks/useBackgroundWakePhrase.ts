import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface UseBackgroundWakePhraseOptions {
  enabled: boolean;
  onWakePhrase: () => void;
  wakePhrases?: string[];
}

export function useBackgroundWakePhrase({
  enabled,
  onWakePhrase,
  wakePhrases = ['hey glow', 'hi glow', 'hello glow'],
}: UseBackgroundWakePhraseOptions) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      // Stop listening if disabled
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
      return;
    }

    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser');
      return;
    }

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      console.log('[Background Wake Phrase] Listening started');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join('')
        .toLowerCase()
        .trim();

      console.log('[Background Wake Phrase] Heard:', transcript);

      // Check if any wake phrase is detected
      const wakePhrase = wakePhrases.find((phrase) => transcript.includes(phrase));
      if (wakePhrase) {
        console.log('[Background Wake Phrase] Wake phrase detected:', wakePhrase);
        onWakePhrase();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[Background Wake Phrase] Error:', event.error);
      
      // Don't show error toasts for common issues
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable microphone permissions.');
        setIsListening(false);
        return;
      }
    };

    recognition.onend = () => {
      console.log('[Background Wake Phrase] Recognition ended, restarting...');
      
      // Auto-restart after a short delay if still enabled
      if (enabled) {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.error('[Background Wake Phrase] Failed to restart:', error);
          }
        }, 1000);
      } else {
        setIsListening(false);
      }
    };

    // Start recognition
    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('[Background Wake Phrase] Failed to start:', error);
      toast.error('Failed to start background listening');
    }

    // Cleanup
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
    };
  }, [enabled, onWakePhrase, wakePhrases]);

  const toggle = () => {
    const newEnabled = !enabled;
    localStorage.setItem('backgroundWakePhrase', newEnabled.toString());
  };

  return {
    isListening,
    toggle,
  };
}
