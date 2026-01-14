'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';

// Macro interface
interface Macro {
  id: string;
  name: string;
  replacementText: string;
  isActive: boolean;
  isGlobal: boolean;
  createdAt: string;
}

// Global macros (available to all users)
const globalMacros: Macro[] = [
  {
    id: 'macro-global-001',
    name: 'neg',
    replacementText: 'negative for acute findings',
    isActive: true,
    isGlobal: true,
    createdAt: '2024-01-12T09:15:00Z',
  },
];

// Helper to get user-specific macros storage key
function getMacrosStorageKey(userId: string | undefined): string {
  return userId ? `ai-rad-macros-${userId}` : 'ai-rad-macros';
}

// Helper to get macros from localStorage
function getStoredMacros(userId: string | undefined): Macro[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(getMacrosStorageKey(userId));
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Helper to get and update usage stats
function getUsageStats(): { reportsGenerated: number; transcriptionMinutes: number } {
  if (typeof window === 'undefined') return { reportsGenerated: 0, transcriptionMinutes: 0 };
  const stored = localStorage.getItem('ai-rad-usage');
  if (!stored) return { reportsGenerated: 0, transcriptionMinutes: 0 };
  try {
    return JSON.parse(stored);
  } catch {
    return { reportsGenerated: 0, transcriptionMinutes: 0 };
  }
}

function addTranscriptionMinutes(minutes: number) {
  const stats = getUsageStats();
  stats.transcriptionMinutes = Math.round((stats.transcriptionMinutes + minutes) * 10) / 10; // Round to 1 decimal
  localStorage.setItem('ai-rad-usage', JSON.stringify(stats));
}

export default function TranscribePage() {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [macros, setMacros] = useState<Macro[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load macros on mount
  useEffect(() => {
    const storedMacros = getStoredMacros(user?.id);
    const allMacros = [...storedMacros, ...globalMacros].filter(m => m.isActive);
    setMacros(allMacros);
  }, [user?.id]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Apply macro expansion to text
  const applyMacros = (text: string): string => {
    let expandedText = text;
    for (const macro of macros) {
      // Create regex that matches the macro name as a whole word (case-insensitive)
      const regex = new RegExp(`\\b${macro.name}\\b`, 'gi');
      expandedText = expandedText.replace(regex, macro.replacementText);
    }
    return expandedText;
  };

  // Handle macro expansion button click
  const handleExpandMacros = () => {
    const expanded = applyMacros(transcribedText);
    setTranscribedText(expanded);
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setTranscribedText('');

    // Start a timer to track recording duration
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = async () => {
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Calculate minutes recorded (minimum 0.1 minutes)
    const minutes = Math.max(0.1, Math.round((recordingTime / 60) * 10) / 10);

    setIsProcessing(true);

    // Simulate transcription processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate sample transcription based on recording duration
    const sampleTranscription = `[Transcribed audio - ${recordingTime} seconds]

The patient presents for follow-up imaging study. Clinical history indicates prior examination showed areas of concern.

EXAMINATION: The study was performed using standard protocol.

FINDINGS: Initial review demonstrates no significant interval changes. The previously noted areas appear stable.

IMPRESSION: No acute findings. Recommend continued monitoring as clinically indicated.`;

    setTranscribedText(sampleTranscription);
    setIsProcessing(false);

    // Add transcription minutes to usage stats
    addTranscriptionMinutes(minutes);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsProcessing(true);
    setTranscribedText('');

    // Simulate file processing (assume 1 minute for demo)
    await new Promise(resolve => setTimeout(resolve, 2500));

    const sampleTranscription = `[Transcribed from: ${file.name}]

The patient presents with clinical findings. Examination was performed according to protocol.

TECHNIQUE: Standard imaging technique was employed.

FINDINGS: The examination reveals normal anatomical structures. No significant abnormalities are identified.

IMPRESSION: Normal examination. No acute pathology identified.`;

    setTranscribedText(sampleTranscription);
    setIsProcessing(false);

    // Add 1 minute of transcription time for uploaded file
    addTranscriptionMinutes(1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcribedText);
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Audio Transcription</h1>
        <p className="mt-1 text-text-secondary">
          Record audio or upload a file to transcribe medical dictations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recording Section */}
        <div className="space-y-6">
          {/* Record Audio */}
          <Card>
            <CardHeader>
              <CardTitle>Record Audio</CardTitle>
              <CardDescription>Click to start recording your dictation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className={`flex h-32 w-32 items-center justify-center rounded-full ${
                  isRecording ? 'animate-pulse bg-danger/20' : 'bg-surface-muted'
                }`}>
                  <span className="text-5xl">{isRecording ? '🔴' : '🎤'}</span>
                </div>

                {isRecording && (
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-text-primary" data-testid="recording-time">
                      {formatTime(recordingTime)}
                    </div>
                    <p className="text-sm text-text-secondary">Recording...</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {!isRecording ? (
                    <Button
                      onClick={startRecording}
                      disabled={isProcessing}
                      data-testid="start-recording-btn"
                    >
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      onClick={stopRecording}
                      data-testid="stop-recording-btn"
                    >
                      Stop Recording
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload File */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Audio File</CardTitle>
              <CardDescription>Upload an audio file for transcription</CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden"
                data-testid="file-upload-input"
              />
              <div className="flex flex-col items-center space-y-4 rounded-lg border-2 border-dashed border-border p-6">
                <span className="text-4xl">📁</span>
                <div className="text-center">
                  <p className="text-sm text-text-secondary">
                    {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-text-muted">MP3, WAV, M4A up to 25MB</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRecording || isProcessing}
                  data-testid="upload-btn"
                >
                  Select File
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transcription Output */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Transcription Result</CardTitle>
            <CardDescription>Your transcribed text will appear here</CardDescription>
          </CardHeader>
          <CardContent>
            {isProcessing ? (
              <div className="flex h-64 flex-col items-center justify-center">
                <div className="mb-4 text-4xl animate-spin">⏳</div>
                <p className="text-text-secondary">Processing transcription...</p>
              </div>
            ) : transcribedText ? (
              <div className="space-y-4">
                <Textarea
                  value={transcribedText}
                  onChange={(e) => setTranscribedText(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  data-testid="transcription-output"
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExpandMacros}
                    disabled={macros.length === 0}
                    data-testid="expand-macros-btn"
                  >
                    ⚡ Expand Macros
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    Copy to Clipboard
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/generate">Use in Report</a>
                  </Button>
                </div>
                {macros.length > 0 && (
                  <p className="text-xs text-text-secondary">
                    {macros.length} macro{macros.length !== 1 ? 's' : ''} available: {macros.map(m => m.name).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center">
                <div className="mb-4 text-5xl">📝</div>
                <p className="text-text-secondary">
                  Record audio or upload a file to see the transcription
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
