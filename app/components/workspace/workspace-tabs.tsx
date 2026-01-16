'use client';

import { Mic, ScrollText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/shared/cn';

export type WorkspaceTab = 'transcribe' | 'report';

interface WorkspaceTabsProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  hasReport?: boolean;
  hasTranscription?: boolean;
}

const tabs = [
  { id: 'transcribe' as const, label: 'Voice Input', description: 'Dictate your observations', icon: Mic, step: 1 },
  { id: 'report' as const, label: 'Report', description: 'Review & export', icon: ScrollText, step: 2 },
];

export function WorkspaceTabs({ activeTab, onTabChange, hasReport, hasTranscription }: WorkspaceTabsProps) {
  return (
    <div className="relative">
      {/* Tab container with clean design */}
      <div className="flex items-center gap-1 px-6 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          const isCompleted = (tab.id === 'transcribe' && hasTranscription) || (tab.id === 'report' && hasReport);

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "group relative flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-medium",
                "transition-all duration-200 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                isActive
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50"
              )}
            >
              {/* Step indicator */}
              <span className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200",
                isActive
                  ? "bg-brand text-white shadow-sm shadow-brand/25"
                  : isCompleted
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-600 dark:text-slate-400"
              )}>
                {isCompleted && !isActive ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>

              {/* Tab content */}
              <div className="flex flex-col items-start">
                <span className={cn(
                  "text-[13px] font-semibold tracking-tight transition-colors",
                  isActive ? "text-slate-900 dark:text-slate-100" : ""
                )}>
                  {tab.label}
                </span>
                <span className={cn(
                  "text-[11px] font-normal transition-colors",
                  isActive ? "text-slate-500 dark:text-slate-400" : "text-slate-400 dark:text-slate-500"
                )}>
                  {tab.description}
                </span>
              </div>
            </button>
          );
        })}

        {/* Connecting arrow between tabs */}
        <div className="hidden sm:flex items-center mx-2">
          <div className="w-8 h-px bg-gradient-to-r from-slate-300 to-slate-200 dark:from-slate-600 dark:to-slate-700" />
          <div className="w-0 h-0 border-t-[4px] border-b-[4px] border-l-[6px] border-transparent border-l-slate-300 dark:border-l-slate-600" />
        </div>
      </div>
    </div>
  );
}
