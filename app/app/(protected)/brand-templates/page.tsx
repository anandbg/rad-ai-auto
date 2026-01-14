'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

// Mock brand templates for development
const mockBrandTemplates = [
  {
    id: 'bt-001',
    name: 'Default Letterhead',
    description: 'Standard professional letterhead with logo',
    isDefault: true,
    primaryColor: '#7C3AED',
    createdAt: '2024-01-10T10:00:00Z',
  },
  {
    id: 'bt-002',
    name: 'Minimalist',
    description: 'Clean minimalist design without logo',
    isDefault: false,
    primaryColor: '#059669',
    createdAt: '2024-01-12T14:30:00Z',
  },
  {
    id: 'bt-003',
    name: 'Corporate Blue',
    description: 'Professional corporate style with blue accents',
    isDefault: false,
    primaryColor: '#2563EB',
    createdAt: '2024-01-14T09:15:00Z',
  },
];

export default function BrandTemplatesPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Brand Templates</h1>
          <p className="mt-1 text-text-secondary">
            Customize your report branding with logos, colors, and typography
          </p>
        </div>
        <Button asChild>
          <Link href="/brand-templates/new">
            + New Template
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockBrandTemplates.map((template) => (
          <Card key={template.id} data-testid={`brand-template-card-${template.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    {template.isDefault && (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                        Default
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                <div
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ backgroundColor: template.primaryColor }}
                  title={`Primary color: ${template.primaryColor}`}
                />
              </div>
            </CardHeader>
            <CardFooter className="gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/brand-templates/${template.id}`}>
                  Preview
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild data-testid={`edit-brand-template-${template.id}`}>
                <Link href={`/brand-templates/${template.id}`}>
                  Edit
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {mockBrandTemplates.length === 0 && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <div className="mb-4 text-5xl">🎨</div>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">No brand templates yet</h3>
          <p className="mb-4 text-sm text-text-secondary">
            Create your first brand template to customize your report appearance
          </p>
          <Button asChild>
            <Link href="/brand-templates/new">
              Create Brand Template
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
