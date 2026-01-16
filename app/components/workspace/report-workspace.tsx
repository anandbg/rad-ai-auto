'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from 'framer-motion';
import { Download, Sparkles, RotateCcw, ScrollText } from 'lucide-react';
import { WorkspaceTabs, WorkspaceTab } from './workspace-tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ReportWorkspaceProps {
  // Props for template selection, report state, etc.
  selectedTemplateId?: string;
  onTemplateSelect?: (id: string) => void;
}

export function ReportWorkspace({ selectedTemplateId, onTemplateSelect }: ReportWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('context');
  const [contextText, setContextText] = useState('');
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleGenerate = async () => {
    setIsGenerating(true);
    // TODO: Integrate with existing generate API
    // For now, simulate generation
    setTimeout(() => {
      setReportContent('Generated report content will appear here...');
      setIsGenerating(false);
      setActiveTab('report');
    }, 1500);
  };

  const handleExportPDF = () => {
    // TODO: Integrate with existing PDF export
    window.print();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with template selector */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">New Report</h1>
          {/* Template selector dropdown - integrate with existing */}
          <select
            className="text-sm border border-border rounded-md px-2 py-1 bg-background focus-ring"
            value={selectedTemplateId || ''}
            onChange={(e) => onTemplateSelect?.(e.target.value)}
            aria-label="Select template"
          >
            <option value="">Select template...</option>
            <option value="ct-chest">CT Chest</option>
            <option value="mri-brain">MRI Brain</option>
            <option value="xray-chest">X-Ray Chest</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setContextText('');
              setReportContent(null);
              setActiveTab('context');
            }}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={!reportContent}
          >
            <Download className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={!contextText || isGenerating}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <WorkspaceTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasReport={!!reportContent}
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {activeTab === 'context' && (
              <ContextTab
                value={contextText}
                onChange={setContextText}
              />
            )}
            {activeTab === 'transcribe' && (
              <TranscribeTab
                onTranscriptionComplete={(text) => {
                  setContextText(prev => prev + '\n' + text);
                  setActiveTab('context');
                }}
              />
            )}
            {activeTab === 'report' && (
              <ReportTab content={reportContent} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Tab content components
function ContextTab({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Card className="h-full p-4">
      <label className="block text-sm font-medium mb-2">Clinical Context & Findings</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter clinical history, indication, and findings..."
        className="w-full h-[calc(100%-2rem)] resize-none border border-border rounded-md p-3 bg-background focus-ring"
      />
    </Card>
  );
}

function TranscribeTab({ onTranscriptionComplete }: { onTranscriptionComplete: (text: string) => void }) {
  // TODO: Integrate with existing transcription component
  return (
    <Card className="h-full p-4 flex flex-col items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl" role="img" aria-label="Microphone">*</span>
        </div>
        <h3 className="text-lg font-medium mb-2">Voice Transcription</h3>
        <p className="text-text-secondary mb-4">
          Click the button below to start recording your findings
        </p>
        <Button onClick={() => onTranscriptionComplete('Sample transcribed text')}>
          Start Recording
        </Button>
      </div>
    </Card>
  );
}

function ReportTab({ content }: { content: string | null }) {
  if (!content) {
    return (
      <Card className="h-full p-4 flex items-center justify-center">
        <div className="text-center text-text-secondary">
          <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No report generated yet.</p>
          <p className="text-sm">Enter context and click &quot;Generate Report&quot;</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full p-4 prose dark:prose-invert max-w-none">
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </Card>
  );
}
