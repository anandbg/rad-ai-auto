'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';
import { usePreferences } from '@/lib/preferences/preferences-context';

// Modality detection result interface
interface ModalityDetection {
  modality: string;
  confidence: number;
  keywords: string[];
}

// Modality detection keywords and patterns
const MODALITY_PATTERNS: { modality: string; keywords: string[]; weight: number }[] = [
  { modality: 'CT', keywords: ['ct', 'ct scan', 'computed tomography', 'cat scan', 'hounsfield', 'contrast enhanced ct', 'cect', 'non-contrast ct', 'ncct'], weight: 1.0 },
  { modality: 'MRI', keywords: ['mri', 'mr', 'magnetic resonance', 't1', 't2', 'flair', 'dwi', 'diffusion weighted', 'gadolinium', 't1w', 't2w'], weight: 1.0 },
  { modality: 'X-Ray', keywords: ['x-ray', 'xray', 'radiograph', 'plain film', 'chest x-ray', 'cxr', 'pa view', 'lateral view', 'ap view'], weight: 1.0 },
  { modality: 'Ultrasound', keywords: ['ultrasound', 'us', 'sonogram', 'sonography', 'doppler', 'echocardiogram', 'echo', 'transducer'], weight: 1.0 },
  { modality: 'PET', keywords: ['pet', 'pet scan', 'pet-ct', 'positron emission', 'fdg', 'suv', 'metabolic activity'], weight: 1.0 },
  { modality: 'Mammography', keywords: ['mammogram', 'mammography', 'breast imaging', 'birads', 'bi-rads', 'breast screening'], weight: 1.0 },
  { modality: 'Fluoroscopy', keywords: ['fluoroscopy', 'fluoro', 'barium', 'swallow study', 'upper gi', 'lower gi', 'real-time imaging'], weight: 1.0 },
  { modality: 'Nuclear Medicine', keywords: ['nuclear', 'scintigraphy', 'bone scan', 'thyroid scan', 'spect', 'gamma camera', 'radiotracer'], weight: 1.0 },
];

// Function to detect modality from text
function detectModality(text: string): ModalityDetection | null {
  if (!text || text.trim().length < 10) return null;

  const lowerText = text.toLowerCase();
  const results: { modality: string; score: number; matchedKeywords: string[] }[] = [];

  for (const pattern of MODALITY_PATTERNS) {
    const matchedKeywords: string[] = [];
    let score = 0;

    for (const keyword of pattern.keywords) {
      // Use word boundary matching for more accurate detection
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        score += matches.length * pattern.weight;
        if (!matchedKeywords.includes(keyword)) {
          matchedKeywords.push(keyword);
        }
      }
    }

    if (score > 0) {
      results.push({ modality: pattern.modality, score, matchedKeywords });
    }
  }

  if (results.length === 0) return null;

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  const bestMatch = results[0];
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);

  // Calculate confidence as percentage of total score
  const confidence = Math.min(99, Math.round((bestMatch.score / Math.max(totalScore, 1)) * 100));

  return {
    modality: bestMatch.modality,
    confidence,
    keywords: bestMatch.matchedKeywords,
  };
}

// Body part detection patterns
const BODY_PART_PATTERNS: { bodyPart: string; keywords: string[] }[] = [
  { bodyPart: 'Head', keywords: ['head', 'brain', 'skull', 'cranial', 'intracranial', 'cerebral'] },
  { bodyPart: 'Neck', keywords: ['neck', 'cervical', 'thyroid', 'carotid', 'larynx'] },
  { bodyPart: 'Chest', keywords: ['chest', 'thorax', 'thoracic', 'lung', 'pulmonary', 'cardiac', 'heart', 'mediastinal', 'pleural'] },
  { bodyPart: 'Abdomen', keywords: ['abdomen', 'abdominal', 'liver', 'spleen', 'kidney', 'renal', 'pancreas', 'gallbladder', 'intestine', 'bowel', 'colon'] },
  { bodyPart: 'Pelvis', keywords: ['pelvis', 'pelvic', 'bladder', 'prostate', 'uterus', 'ovary', 'rectum', 'hip'] },
  { bodyPart: 'Spine', keywords: ['spine', 'spinal', 'vertebra', 'disc', 'lumbar', 'thoracic spine', 'cervical spine', 'sacral'] },
  { bodyPart: 'Upper Extremity', keywords: ['arm', 'shoulder', 'elbow', 'wrist', 'hand', 'humerus', 'radius', 'ulna'] },
  { bodyPart: 'Lower Extremity', keywords: ['leg', 'knee', 'ankle', 'foot', 'femur', 'tibia', 'fibula', 'thigh', 'calf'] },
];

// Function to detect body part from text
function detectBodyPart(text: string): string | null {
  if (!text || text.trim().length < 10) return null;

  const lowerText = text.toLowerCase();
  const results: { bodyPart: string; score: number }[] = [];

  for (const pattern of BODY_PART_PATTERNS) {
    let score = 0;
    for (const keyword of pattern.keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      results.push({ bodyPart: pattern.bodyPart, score });
    }
  }

  if (results.length === 0) return null;
  results.sort((a, b) => b.score - a.score);
  return results[0].bodyPart;
}

// Context expansion interface
interface ContextExpansion {
  bodyPart: string;
  text: string;
}

// Macro interface
interface Macro {
  id: string;
  name: string;
  replacementText: string;
  isActive: boolean;
  isGlobal: boolean;
  createdAt: string;
  // Smart macro support
  isSmartMacro?: boolean;
  contextExpansions?: ContextExpansion[];
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
  const { preferences } = usePreferences();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [detectedModality, setDetectedModality] = useState<ModalityDetection | null>(null);
  const [detectedBodyPart, setDetectedBodyPart] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect modality and body part when transcribed text changes
  useEffect(() => {
    if (transcribedText && !isProcessing) {
      // Always detect body part for smart macros
      const bodyPart = detectBodyPart(transcribedText);
      setDetectedBodyPart(bodyPart);

      // Detect modality only when YOLO mode is enabled
      if (preferences.yoloMode) {
        const detection = detectModality(transcribedText);
        setDetectedModality(detection);
      } else {
        setDetectedModality(null);
      }
    } else if (!transcribedText) {
      setDetectedBodyPart(null);
      setDetectedModality(null);
    }
  }, [transcribedText, preferences.yoloMode, isProcessing]);

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

  // Apply macro expansion to text with context awareness
  const applyMacros = (text: string, bodyPartContext?: string | null): string => {
    let expandedText = text;
    const currentBodyPart = bodyPartContext || detectedBodyPart;

    for (const macro of macros) {
      // Create regex that matches the macro name as a whole word (case-insensitive)
      const regex = new RegExp(`\\b${macro.name}\\b`, 'gi');

      // Determine the replacement text
      let replacement = macro.replacementText;

      // If smart macro with context expansions, check for matching body part
      if (macro.isSmartMacro && macro.contextExpansions && macro.contextExpansions.length > 0 && currentBodyPart) {
        const contextMatch = macro.contextExpansions.find(
          ctx => ctx.bodyPart.toLowerCase() === currentBodyPart.toLowerCase()
        );
        if (contextMatch) {
          replacement = contextMatch.text;
          console.log(`[Smart Macro] "${macro.name}" expanded with ${currentBodyPart} context: "${replacement}"`);
        }
      }

      expandedText = expandedText.replace(regex, replacement);
    }
    return expandedText;
  };

  // Handle macro expansion button click
  const handleExpandMacros = () => {
    const expanded = applyMacros(transcribedText);
    setTranscribedText(expanded);
  };

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setIsPaused(false);
    setRecordingTime(0);
    setTranscribedText('');

    // Start a timer to track recording duration
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  }, []);

  const pauseRecording = useCallback(() => {
    setIsPaused(true);
    // Stop the timer while paused
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resumeRecording = useCallback(() => {
    setIsPaused(false);
    // Resume the timer
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  }, []);

  const cancelRecording = useCallback(() => {
    // Stop and discard recording without processing
    setIsRecording(false);
    setIsPaused(false);
    setRecordingTime(0);
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // No transcription minutes are added - recording is discarded
  }, []);

  // Auto-start recording when ?autostart=true is in URL (YOLO one-click workflow)
  useEffect(() => {
    // Check URL directly to avoid suspense issues with useSearchParams
    const urlParams = new URLSearchParams(window.location.search);
    const shouldAutoStart = urlParams.get('autostart') === 'true';

    if (shouldAutoStart && !isRecording && !isProcessing) {
      // Small delay to ensure UI is ready
      const timeoutId = setTimeout(() => {
        startRecording();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  const stopRecording = async () => {
    setIsRecording(false);
    setIsPaused(false);

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
    // Include modality keywords for YOLO mode detection testing
    const sampleTranscription = `[Transcribed audio - ${recordingTime} seconds]

The patient presents for CT scan of the chest. Clinical history indicates prior CT examination showed areas of concern in the lung fields.

EXAMINATION: CT scan of the chest was performed using standard protocol with IV contrast.

TECHNIQUE: Helical CT scan from thoracic inlet to adrenal glands with 5mm slice thickness.

FINDINGS: Initial CT review demonstrates no significant interval changes. The previously noted pulmonary nodule appears stable.

IMPRESSION: No acute findings on CT. Recommend continued monitoring as clinically indicated.`;

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
                  isRecording && !isPaused ? 'animate-pulse bg-danger/20' :
                  isPaused ? 'bg-warning/20' : 'bg-surface-muted'
                }`}>
                  <span className="text-5xl">{isRecording ? (isPaused ? '⏸️' : '🔴') : '🎤'}</span>
                </div>

                {isRecording && (
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-text-primary" data-testid="recording-time">
                      {formatTime(recordingTime)}
                    </div>
                    <p className="text-sm text-text-secondary" data-testid="recording-status">
                      {isPaused ? 'Paused' : 'Recording...'}
                    </p>
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
                    <>
                      {!isPaused ? (
                        <Button
                          variant="secondary"
                          onClick={pauseRecording}
                          data-testid="pause-recording-btn"
                        >
                          ⏸️ Pause
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={resumeRecording}
                          data-testid="resume-recording-btn"
                        >
                          ▶️ Resume
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={cancelRecording}
                        data-testid="cancel-recording-btn"
                      >
                        ✕ Cancel
                      </Button>
                      <Button
                        variant="danger"
                        onClick={stopRecording}
                        data-testid="stop-recording-btn"
                      >
                        Stop Recording
                      </Button>
                    </>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setTranscribedText('');
                      setUploadedFile(null);
                      setDetectedModality(null);
                      setDetectedBodyPart(null);
                    }}
                    data-testid="clear-transcription-btn"
                  >
                    🗑️ Clear
                  </Button>
                </div>
                {macros.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-text-secondary">
                      {macros.length} macro{macros.length !== 1 ? 's' : ''} available: {macros.map(m => m.name).join(', ')}
                    </p>
                    {macros.some(m => m.isSmartMacro) && (
                      <p className="text-xs text-warning" data-testid="smart-macros-available">
                        🧠 {macros.filter(m => m.isSmartMacro).length} smart macro(s) with context-aware expansion
                      </p>
                    )}
                  </div>
                )}
                {/* Body Part Detection for Smart Macros */}
                {detectedBodyPart && macros.some(m => m.isSmartMacro) && (
                  <div
                    className="mt-2 rounded-lg border border-warning/30 bg-warning/5 p-3"
                    data-testid="body-part-detection"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span>🧠</span>
                      <span className="text-text-secondary">Detected body part:</span>
                      <span className="font-semibold text-warning" data-testid="detected-body-part">
                        {detectedBodyPart}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">
                      Smart macros will use context-specific expansions for {detectedBodyPart}
                    </p>
                  </div>
                )}
                {/* YOLO Mode - Modality Detection */}
                {preferences.yoloMode && detectedModality && (
                  <div
                    className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4"
                    data-testid="yolo-modality-detection"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🚀</span>
                      <span className="font-semibold text-primary">YOLO Mode - Modality Detected</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-sm text-text-secondary">Detected Modality:</span>
                        <span
                          className="ml-2 font-bold text-lg text-text-primary"
                          data-testid="detected-modality"
                        >
                          {detectedModality.modality}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary">Confidence:</span>
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-24 rounded-full bg-surface-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${detectedModality.confidence}%` }}
                            />
                          </div>
                          <span
                            className="text-sm font-medium text-primary"
                            data-testid="detection-confidence"
                          >
                            {detectedModality.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                    {detectedModality.keywords.length > 0 && (
                      <div className="mt-2 text-xs text-text-muted">
                        Keywords found: {detectedModality.keywords.join(', ')}
                      </div>
                    )}
                    <div className="mt-3">
                      <Button
                        size="sm"
                        asChild
                        data-testid="yolo-generate-report"
                      >
                        <a href={`/generate?modality=${encodeURIComponent(detectedModality.modality)}&yolo=true`}>
                          🚀 Auto-Generate Report with {detectedModality.modality}
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
                {preferences.yoloMode && !detectedModality && transcribedText && (
                  <div className="mt-4 rounded-lg border border-warning/30 bg-warning/5 p-3">
                    <div className="flex items-center gap-2 text-sm text-warning">
                      <span>⚠️</span>
                      <span>YOLO Mode active but no modality detected. Add modality keywords (CT, MRI, X-Ray, etc.) to enable auto-detection.</span>
                    </div>
                  </div>
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
