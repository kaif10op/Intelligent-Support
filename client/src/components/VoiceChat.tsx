import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader } from 'lucide-react';
import axios from 'axios';

interface VoiceChatProps {
  chatId: string;
  onTranscriptionComplete?: (text: string) => void;
  onSynthesisComplete?: (audioUrl: string) => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  chatId,
  onTranscriptionComplete,
  onSynthesisComplete
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [language, setLanguage] = useState('en');
  const [voice, setVoice] = useState<'male' | 'female'>('female');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Load voice settings from API
    const loadVoiceSettings = async () => {
      try {
        // Settings would be stored/retrieved from API
        // For now, use state defaults
      } catch (error) {
        console.error('Failed to load voice settings:', error);
      }
    };
    loadVoiceSettings();
  }, [chatId]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioToTranscribe(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Microphone access is required for voice input');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const sendAudioToTranscribe = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      formData.append('language', language);

      const response = await axios.post('http://localhost:8000/api/voice/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      const text = response.data.transcription;
      setTranscribedText(text);
      onTranscriptionComplete?.(text);
    } catch (error) {
      console.error('Transcription failed:', error);
      alert('Failed to transcribe audio');
    }
  };

  const synthesizeResponse = async (text: string) => {
    try {
      setIsSynthesizing(true);

      const response = await axios.post(
        'http://localhost:8000/api/voice/synthesize',
        {
          text,
          voice,
          language
        },
        { withCredentials: true }
      );

      const audioUrl = response.data.audio_url;
      onSynthesisComplete?.(audioUrl);

      // Play audio if URL is provided
      if (audioUrl) {
        playAudio(audioUrl);
      }
    } catch (error) {
      console.error('Synthesis failed:', error);
      alert('Failed to synthesize audio');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch((error) => console.error('Playback failed:', error));
  };

  return (
    <div className="voice-chat-widget" style={styles.container}>
      <div style={styles.header}>
        <h3>Voice Chat</h3>
        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(e) => setVoiceEnabled(e.target.checked)}
            style={styles.checkbox}
          />
          <span>Enable Voice</span>
        </label>
      </div>

      {voiceEnabled && (
        <div style={styles.content}>
          {/* Speech-to-Text Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Mic size={18} />
              <span>Listening</span>
            </div>
            <div style={styles.controls}>
              <button
                onClick={isListening ? stopListening : startListening}
                style={{
                  ...styles.button,
                  ...(isListening ? styles.buttonActive : {})}
                }
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                {isListening ? 'Stop' : 'Start'}
              </button>
            </div>
            {transcribedText && (
              <div style={styles.result}>
                <small>Transcribed:</small>
                <p>{transcribedText}</p>
              </div>
            )}
          </div>

          {/* Text-to-Speech Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <Volume2 size={18} />
              <span>Voice Settings</span>
            </div>
            <div style={styles.settings}>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={styles.select}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>

              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value as any)}
                style={styles.select}
              >
                <option value="female">Female Voice</option>
                <option value="male">Male Voice</option>
              </select>

              <button
                onClick={() => synthesizeResponse('This is a test message')}
                disabled={isSynthesizing}
                style={{
                  ...styles.button,
                  ...(isSynthesizing ? styles.buttonDisabled : {})
                }}
              >
                {isSynthesizing ? <Loader size={18} /> : <Volume2 size={18} />}
                {isSynthesizing ? 'Synthesizing...' : 'Test Voice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    border: '1px solid rgba(0, 210, 255, 0.3)',
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: 'rgba(0, 210, 255, 0.05)',
    marginBottom: '16px'
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  } as React.CSSProperties,
  content: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px'
  },
  section: {
    padding: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px'
  } as React.CSSProperties,
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '14px',
    fontWeight: '600'
  } as React.CSSProperties,
  controls: {
    display: 'flex',
    gap: '8px'
  } as React.CSSProperties,
  settings: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#00d2ff',
    border: 'none',
    borderRadius: '4px',
    color: '#000',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  } as React.CSSProperties,
  buttonActive: {
    backgroundColor: '#ff0080'
  } as React.CSSProperties,
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  } as React.CSSProperties,
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #00d2ff',
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
    color: '#fff',
    fontSize: '14px'
  } as React.CSSProperties,
  result: {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: 'rgba(0, 255, 128, 0.1)',
    borderRadius: '4px',
    fontSize: '13px'
  } as React.CSSProperties,
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    cursor: 'pointer'
  } as React.CSSProperties,
  checkbox: {
    cursor: 'pointer'
  } as React.CSSProperties
};
