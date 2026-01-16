'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sidebar } from './sidebar';
import { ReportsPanel } from './reports-panel';
import { cn } from '@/lib/shared/cn';
import { DURATION, EASE } from '@/lib/motion/constants';

interface AppShellProps {
  children: React.ReactNode;
  showReportsPanel?: boolean;
}

export function AppShell({ children, showReportsPanel = true }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [reportsPanelVisible, setReportsPanelVisible] = useState(showReportsPanel);
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - always visible on desktop, collapsible */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onToggleReportsPanel={() => setReportsPanelVisible(!reportsPanelVisible)}
        reportsPanelVisible={reportsPanelVisible}
      />

      {/* Reports Panel - toggleable middle panel */}
      <AnimatePresence mode="wait">
        {reportsPanelVisible && (
          <motion.div
            initial={shouldReduceMotion ? false : { width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{
              duration: shouldReduceMotion ? 0 : DURATION.normal,
              ease: EASE.out
            }}
            className="border-r border-border bg-surface overflow-hidden flex-shrink-0 hidden md:block"
          >
            <ReportsPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace - flexible width */}
      <main
        id="main-content"
        className={cn(
          "flex-1 overflow-auto",
          "pt-16 md:pt-0" // Account for mobile header
        )}
      >
        {children}
      </main>
    </div>
  );
}
