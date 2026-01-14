'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Template interface
interface Template {
  id: string;
  name: string;
  modality: string;
  bodyPart: string;
  description: string;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock templates for development
const mockTemplates: Template[] = [
  {
    id: 'tpl-001',
    name: 'Chest X-Ray Standard',
    modality: 'X-Ray',
    bodyPart: 'Chest',
    description: 'Standard chest X-ray report template with PA and lateral views',
    isGlobal: true,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'tpl-002',
    name: 'CT Abdomen',
    modality: 'CT',
    bodyPart: 'Abdomen',
    description: 'CT scan of abdomen and pelvis with and without contrast',
    isGlobal: true,
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
  },
  {
    id: 'tpl-003',
    name: 'MRI Brain',
    modality: 'MRI',
    bodyPart: 'Head',
    description: 'Standard brain MRI with diffusion-weighted imaging',
    isGlobal: false,
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-14T09:15:00Z',
  },
];

// Helper to get templates from localStorage
function getStoredTemplates(): Template[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('ai-rad-templates');
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Helper to save templates to localStorage
function saveTemplates(templates: Template[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ai-rad-templates', JSON.stringify(templates));
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load templates on mount
  useEffect(() => {
    const storedTemplates = getStoredTemplates();
    // Combine mock templates with stored ones (stored take precedence by ID)
    const storedIds = new Set(storedTemplates.map(t => t.id));
    const combinedTemplates = [
      ...storedTemplates,
      ...mockTemplates.filter(t => !storedIds.has(t.id)),
    ];
    setTemplates(combinedTemplates);
    setIsLoading(false);
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.bodyPart.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = selectedModality === 'all' || template.modality === selectedModality;
    return matchesSearch && matchesModality;
  });

  // Get unique modalities for filter
  const modalities = ['all', ...new Set(templates.map(t => t.modality))];

  // Personal vs Global templates
  const personalTemplates = filteredTemplates.filter(t => !t.isGlobal);
  const globalTemplates = filteredTemplates.filter(t => t.isGlobal);

  const handleDelete = (id: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    saveTemplates(updatedTemplates.filter(t => !mockTemplates.some(m => m.id === t.id)));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">Loading...</div>
          <p className="text-text-secondary">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Report Templates</h1>
          <p className="mt-1 text-text-secondary">
            Manage your radiology report templates
          </p>
        </div>
        <Button asChild data-testid="create-template-button">
          <Link href="/templates/new">
            + Create Template
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="template-search"
          />
        </div>
        <div className="flex gap-2">
          {modalities.map((modality) => (
            <Button
              key={modality}
              variant={selectedModality === modality ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedModality(modality)}
            >
              {modality === 'all' ? 'All' : modality}
            </Button>
          ))}
        </div>
      </div>

      {/* Personal Templates */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Personal Templates ({personalTemplates.length})
        </h2>
        {personalTemplates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 text-5xl">📝</div>
              <h3 className="mb-2 text-lg font-semibold text-text-primary">No personal templates</h3>
              <p className="mb-4 text-center text-sm text-text-secondary">
                Create your own templates or clone from global templates
              </p>
              <Button asChild>
                <Link href="/templates/new">Create Template</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {personalTemplates.map((template) => (
              <Card key={template.id} data-testid={`template-card-${template.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle data-testid={`template-name-${template.id}`}>{template.name}</CardTitle>
                      <CardDescription>{template.modality} - {template.bodyPart}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {template.description}
                  </p>
                </CardContent>
                <CardFooter className="justify-between">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/templates/${template.id}`}>Edit</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-error hover:text-error"
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Global Templates */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Global Templates ({globalTemplates.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {globalTemplates.map((template) => (
            <Card key={template.id} data-testid={`template-card-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle data-testid={`template-name-${template.id}`}>{template.name}</CardTitle>
                    <CardDescription>{template.modality} - {template.bodyPart}</CardDescription>
                  </div>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                    Global
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-secondary line-clamp-2">
                  {template.description}
                </p>
              </CardContent>
              <CardFooter className="justify-between">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/templates/${template.id}`}>View</Link>
                </Button>
                <Button variant="outline" size="sm">
                  Clone
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty state if no templates match filter */}
      {filteredTemplates.length === 0 && templates.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-text-secondary">No templates match your search criteria</p>
          <Button variant="ghost" onClick={() => { setSearchQuery(''); setSelectedModality('all'); }}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
