import React, { useEffect, useRef, useState } from 'react';
import { Loader, Mic, MicOff, Volume2 } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS, axiosConfig } from '../config/api';

interface VoiceChatProps {
  chatId: string;
  onTranscriptionComplete?: (text: string) => void;
  onSynthesisComplete?: (audioUrl: string) => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  chatId,
  onTranscriptionComplete,
  onSynthesisComplete,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [language, setLanguage] = useState('en');
  const [voice, setVoice] = useState<'male' | 'female'>('female');
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    void chatId;
  }, [chatId]);

  const startListening = async () => {
    try {
      setError(null);
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
    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('Microphone access is required for voice input.');
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
      setError(null);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      formData.append('language', language);

      const response = await axios.post(API_ENDPOINTS.VOICE_TRANSCRIBE, formData, {
        ...axiosConfig,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const text = response.data.transcription;
      setTranscribedText(text);
      onTranscriptionComplete?.(text);
    } catch (err) {
      console.error('Transcription failed:', err);
      setError('Failed to transcribe audio. Please try again.');
    }
  };

  const synthesizeResponse = async (text: string) => {
    try {
      setError(null);
      setIsSynthesizing(true);

      const response = await axios.post(
        API_ENDPOINTS.VOICE_SYNTHESIZE,
        {
          text,
          voice,
          language,
        },
        axiosConfig,
      );

      const audioUrl = response.data.audio_url;
      onSynthesisComplete?.(audioUrl);

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        await audio.play();
      }
    } catch (err) {
      console.error('Synthesis failed:', err);
      setError('Failed to synthesize or play audio. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">Voice Chat</h3>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={voiceEnabled}
            onChange={(e) => setVoiceEnabled(e.target.checked)}
            className="accent-primary"
          />
          <span>Enable Voice</span>
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {voiceEnabled && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-background/60 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Mic size={18} />
              <span>Listening</span>
            </div>
            <button
              onClick={isListening ? stopListening : startListening}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isListening
                  ? 'bg-destructive/15 text-destructive border border-destructive/30'
                  : 'bg-primary text-white hover:bg-primary-600'
              }`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              {isListening ? 'Stop' : 'Start'}
            </button>

            {transcribedText && (
              <div className="rounded-md border border-border bg-card px-3 py-2 text-xs">
                <small className="font-semibold text-muted-foreground">Transcribed:</small>
                <p className="mt-1 text-foreground">{transcribedText}</p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-background/60 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Volume2 size={18} />
              <span>Voice Settings</span>
            </div>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>

            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value as 'male' | 'female')}
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="female">Female Voice</option>
              <option value="male">Male Voice</option>
            </select>

            <button
              onClick={() => synthesizeResponse('This is a test message')}
              disabled={isSynthesizing}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-primary text-white hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSynthesizing ? <Loader size={18} className="animate-spin" /> : <Volume2 size={18} />}
              {isSynthesizing ? 'Synthesizing...' : 'Test Voice'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceChat;
