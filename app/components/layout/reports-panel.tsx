'use client';

import { useState } from 'react';
import { Search, FileText, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/shared/cn';
import { StaggerContainer } from '@/components/motion/stagger-container';
import { FadeIn } from '@/components/motion/fade-in';

interface Report {
  id: string;
  title: string;
  studyType: string;
  status: 'draft' | 'completed';
  createdAt: Date;
}

// Mock data - will be replaced with real data from database
const mockReports: Report[] = [
  { id: '1', title: 'CT Chest with Contrast', studyType: 'CT', status: 'draft', createdAt: new Date() },
  { id: '2', title: 'MRI Brain without Contrast', studyType: 'MRI', status: 'completed', createdAt: new Date(Date.now() - 86400000) },
  { id: '3', title: 'X-Ray Chest PA/Lateral', studyType: 'X-Ray', status: 'completed', createdAt: new Date(Date.now() - 172800000) },
];

export function ReportsPanel() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredReports = mockReports.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const groupedReports = groupByDate(filteredReports);

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search reports"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-auto">
        <StaggerContainer className="p-2">
          {Object.entries(groupedReports).map(([date, reports]) => (
            <div key={date} className="mb-4">
              <FadeIn>
                <h3 className="text-xs font-medium text-text-secondary px-2 py-1">
                  {date}
                </h3>
              </FadeIn>
              {reports.map((report) => (
                <FadeIn key={report.id}>
                  <button
                    onClick={() => setSelectedId(report.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-2 py-2 rounded-md text-left",
                      "hover:bg-surface-muted transition-colors duration-150",
                      "focus-ring",
                      selectedId === report.id && "bg-surface-muted"
                    )}
                  >
                    <FileText className="h-4 w-4 text-text-secondary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{report.title}</p>
                      <p className="text-xs text-text-secondary">{report.studyType}</p>
                    </div>
                    {report.status === 'draft' && (
                      <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded">
                        Draft
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-text-secondary" />
                  </button>
                </FadeIn>
              ))}
            </div>
          ))}
          {Object.keys(groupedReports).length === 0 && (
            <FadeIn>
              <p className="text-sm text-text-secondary text-center py-8">
                No reports found
              </p>
            </FadeIn>
          )}
        </StaggerContainer>
      </div>

      {/* New Report Button */}
      <div className="p-3 border-t border-border">
        <button className="w-full bg-brand text-white hover:bg-brand/90 transition-colors duration-150 px-4 py-2.5 rounded-lg font-medium text-sm focus-ring">
          + New Report
        </button>
      </div>
    </div>
  );
}

function groupByDate(reports: Report[]): Record<string, Report[]> {
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  return reports.reduce((acc, report) => {
    const dateStr = report.createdAt.toDateString();
    const label = dateStr === today ? 'Today'
      : dateStr === yesterday ? 'Yesterday'
      : report.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (!acc[label]) acc[label] = [];
    acc[label].push(report);
    return acc;
  }, {} as Record<string, Report[]>);
}
