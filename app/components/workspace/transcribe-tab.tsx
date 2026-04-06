'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/shared/cn';
import { PageWarning } from '@/components/legal/page-warning';
import { Mic, MicOff, FileText, Loader2, Upload } from 'lucide-react';

export interface TranscribeTabProps {
  transcription: string;
  onTranscriptionChange: (text: string) => void;
}

export function TranscribeTab({
  transcription,
  onTranscriptionChange,
}: TranscribeTabProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Handle transcription API call
  const handleTranscribe = async (audioBlob: Blob | File) => {
    setIsTranscribing(true);
    setTranscriptionError(null);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Transcription failed');
      }

      const data = await res.json();
      onTranscriptionChange(
        transcription ? `${transcription}\n\n${data.transcript}` : data.transcript
      );
    } catch (error) {
      console.error('Transcription error:', error);
      setTranscriptionError(
        error instanceof Error ? error.message : 'Failed to transcribe audio'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleTranscribe(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle live recording toggle
  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Determine supported MIME type for recording
        // Prefer webm for Chrome/Firefox, fall back to mp4 for Safari
        const mimeTypes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/mpeg',
          'audio/wav',
        ];
        const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';

        const mediaRecorder = supportedMimeType
          ? new MediaRecorder(stream, { mimeType: supportedMimeType })
          : new MediaRecorder(stream);

        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          // Use the actual MIME type from the recorder
          const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });

          // Create a File with proper extension for OpenAI
          const extension = actualMimeType.includes('mp4') ? 'mp4'
            : actualMimeType.includes('mpeg') ? 'mp3'
            : actualMimeType.includes('wav') ? 'wav'
            : 'webm';
          const audioFile = new File([audioBlob], `recording.${extension}`, { type: actualMimeType });

          handleTranscribe(audioFile);
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setTranscriptionError(null);
      } catch (error) {
        console.error('Failed to start recording:', error);
        setTranscriptionError(
          'Could not access microphone. Please check your browser permissions.'
        );
      }
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <PageWarning variant="transcription" />
      <div className="flex-1 flex flex-col lg:flex-row gap-6">
      {/* Left: Recording controls */}
      <div className={cn(
        "flex flex-col items-center justify-center p-8 rounded-2xl",
        "bg-white dark:bg-slate-800/50",
        "border border-slate-200/80 dark:border-slate-700/50",
        "shadow-sm",
        "lg:w-80 lg:shrink-0"
      )}>
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".mp3,.wav,.m4a,.webm,.mp4,.mpeg"
          className="hidden"
        />

        {/* Microphone Button */}
        <div className="mb-6">
          <button
            onClick={handleToggleRecording}
            disabled={isTranscribing}
            className={cn(
              "relative flex h-28 w-28 items-center justify-center rounded-full",
              "transition-all duration-300 ease-out",
              "focus-visible:outline-none focus-visible:ring-4",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isRecording
                ? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl shadow-red-500/40 focus-visible:ring-red-300"
                : isTranscribing
                  ? "bg-gradient-to-br from-brand/80 to-brand text-white shadow-xl shadow-brand/40"
                  : "bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 text-slate-600 dark:text-slate-300 hover:scale-105 focus-visible:ring-brand/30"
            )}
          >
            {isTranscribing ? (
              <Loader2 className="h-12 w-12 animate-spin" />
            ) : isRecording ? (
              <MicOff className="h-12 w-12" />
            ) : (
              <Mic className="h-12 w-12" />
            )}

            {/* Pulse animation */}
            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />
                <span className="absolute inset-[-4px] rounded-full border-2 border-red-300/50 animate-pulse" />
              </>
            )}
          </button>
        </div>

        {/* Status text */}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 text-center">
          {isTranscribing ? 'Transcribing...' : isRecording ? 'Recording...' : 'Voice Input'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6 max-w-xs">
          {isTranscribing
            ? 'Processing audio with AI transcription...'
            : isRecording
              ? 'Speak clearly. Click to stop and transcribe.'
              : 'Click the microphone to dictate your observations.'}
        </p>

        {/* Error message */}
        {transcriptionError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 text-center max-w-xs">
            {transcriptionError}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button
            onClick={handleToggleRecording}
            size="lg"
            variant={isRecording ? 'outline' : 'primary'}
            disabled={isTranscribing}
            className={cn(
              "w-full",
              isRecording && "border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
            )}
          >
            {isTranscribing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Transcribing...
              </>
            ) : isRecording ? (
              'Stop & Transcribe'
            ) : (
              'Start Recording'
            )}
          </Button>

          {/* Upload Audio Button */}
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="lg"
            variant="outline"
            disabled={isRecording || isTranscribing}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Audio
          </Button>
        </div>
      </div>

      {/* Right: Transcription preview */}
      <div className={cn(
        "flex-1 flex flex-col rounded-2xl overflow-hidden",
        "bg-white dark:bg-slate-800/50",
        "border border-slate-200/80 dark:border-slate-700/50",
        "shadow-sm"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
              <FileText className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Transcription
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Your dictated observations appear here
              </p>
            </div>
          </div>
          {transcription && (
            <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
              {transcription.length} characters
            </span>
          )}
        </div>

        {/* Transcription Content */}
        <div className="flex-1 p-1">
          <textarea
            value={transcription}
            onChange={(e) => onTranscriptionChange(e.target.value)}
            placeholder="Your voice transcription will appear here. You can also type or edit directly..."
            className={cn(
              "h-full w-full resize-none p-4",
              "bg-transparent",
              "text-sm text-slate-700 dark:text-slate-200",
              "placeholder:text-slate-400 dark:placeholder:text-slate-500",
              "focus:outline-none",
              "leading-relaxed"
            )}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
