'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

// Mock global templates for development
const mockGlobalTemplates = [
  {
    id: 'global-001',
    name: 'CT Head Standard',
    modality: 'CT',
    bodyPart: 'Head',
    description: 'Standard CT head template with comprehensive sections',
    isPublished: true,
    createdAt: '2024-01-05T10:00:00Z',
  },
  {
    id: 'global-002',
    name: 'MRI Brain Protocol',
    modality: 'MRI',
    bodyPart: 'Brain',
    description: 'Standard MRI brain template with contrast sections',
    isPublished: true,
    createdAt: '2024-01-08T14:30:00Z',
  },
  {
    id: 'global-003',
    name: 'Chest X-Ray',
    modality: 'XR',
    bodyPart: 'Chest',
    description: 'Two-view chest x-ray template',
    isPublished: true,
    createdAt: '2024-01-10T09:15:00Z',
  },
  {
    id: 'global-004',
    name: 'Abdomen CT Draft',
    modality: 'CT',
    bodyPart: 'Abdomen',
    description: 'Draft template for abdominal CT with contrast',
    isPublished: false,
    createdAt: '2024-01-12T16:45:00Z',
  },
];

export default function AdminTemplatesPage() {
  const publishedTemplates = mockGlobalTemplates.filter(t => t.isPublished);
  const draftTemplates = mockGlobalTemplates.filter(t => !t.isPublished);

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/admin" className="hover:text-text-primary">
          Admin
        </Link>
        <span>/</span>
        <span className="text-text-primary">Global Templates</span>
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Global Templates</h1>
          <p className="mt-1 text-text-secondary">
            Manage system-wide report templates available to all users
          </p>
        </div>
        <Button>
          + Create Template
        </Button>
      </div>

      {/* Published Templates */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Published ({publishedTemplates.length})
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {publishedTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description}
                    </CardDescription>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium">
                    {template.modality}
                  </span>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium">
                    {template.bodyPart}
                  </span>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    Published
                  </span>
                </div>
              </CardHeader>
              <CardFooter className="gap-2">
                <Button variant="ghost" size="sm">
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-danger">
                  Unpublish
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Draft Templates */}
      {draftTemplates.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-text-secondary">
            Drafts ({draftTemplates.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 opacity-75">
            {draftTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium">
                      {template.modality}
                    </span>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium">
                      {template.bodyPart}
                    </span>
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                      Draft
                    </span>
                  </div>
                </CardHeader>
                <CardFooter className="gap-2">
                  <Button variant="ghost" size="sm">
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="primary" size="sm">
                    Publish
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
