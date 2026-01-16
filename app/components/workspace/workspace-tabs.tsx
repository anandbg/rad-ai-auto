'use client';

import { motion } from 'framer-motion';
import { FileText, Mic, ScrollText } from 'lucide-react';
import { cn } from '@/lib/shared/cn';

export type WorkspaceTab = 'context' | 'transcribe' | 'report';

interface WorkspaceTabsProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  hasReport?: boolean;
}

const tabs = [
  { id: 'context' as const, label: 'Context', icon: FileText },
  { id: 'transcribe' as const, label: 'Transcribe', icon: Mic },
  { id: 'report' as const, label: 'Report', icon: ScrollText },
];

export function WorkspaceTabs({ activeTab, onTabChange, hasReport }: WorkspaceTabsProps) {
  return (
    <div className="flex border-b border-border">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 text-sm font-medium",
              "transition-colors hover:text-foreground focus-ring",
              isActive ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
            {tab.id === 'report' && hasReport && (
              <span className="h-2 w-2 rounded-full bg-green-500" />
            )}
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand"
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
