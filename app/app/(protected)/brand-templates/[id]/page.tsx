'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

// Mock brand templates for development (same as list page)
const mockBrandTemplates: Record<string, {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl?: string;
  institutionName: string;
  institutionAddress: string;
  footerText: string;
  createdAt: string;
  updatedAt: string;
}> = {
  'bt-001': {
    id: 'bt-001',
    name: 'Default Letterhead',
    description: 'Standard professional letterhead with logo',
    isDefault: true,
    primaryColor: '#7C3AED',
    secondaryColor: '#A78BFA',
    fontFamily: 'Inter',
    institutionName: 'City Medical Center',
    institutionAddress: '123 Healthcare Blvd, Medical City, MC 12345',
    footerText: 'This report is confidential and intended for medical professionals only.',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  'bt-002': {
    id: 'bt-002',
    name: 'Minimalist',
    description: 'Clean minimalist design without logo',
    isDefault: false,
    primaryColor: '#059669',
    secondaryColor: '#34D399',
    fontFamily: 'System',
    institutionName: 'Metro Radiology Associates',
    institutionAddress: '456 Imaging Center Dr, Suite 200',
    footerText: 'Confidential medical document.',
    createdAt: '2024-01-12T14:30:00Z',
    updatedAt: '2024-01-12T14:30:00Z',
  },
  'bt-003': {
    id: 'bt-003',
    name: 'Corporate Blue',
    description: 'Professional corporate style with blue accents',
    isDefault: false,
    primaryColor: '#2563EB',
    secondaryColor: '#60A5FA',
    fontFamily: 'Arial',
    institutionName: 'Regional Hospital Network',
    institutionAddress: '789 Hospital Way, Healthcare District',
    footerText: 'For authorized medical personnel only. All rights reserved.',
    createdAt: '2024-01-14T09:15:00Z',
    updatedAt: '2024-01-14T09:15:00Z',
  },
};

export default function BrandTemplateEditPage() {
  const params = useParams();
  const id = params.id as string;

  const template = mockBrandTemplates[id];

  if (!template) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <div className="mb-4 text-5xl">404</div>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">Brand Template Not Found</h3>
          <p className="mb-4 text-sm text-text-secondary">
            The brand template you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/brand-templates">
              Back to Brand Templates
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
          <Link href="/brand-templates" className="hover:text-text-primary">
            Brand Templates
          </Link>
          <span>/</span>
          <span className="text-text-primary">{template.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary" data-testid="brand-template-name">
              {template.name}
            </h1>
            <p className="mt-1 text-text-secondary">
              {template.description}
            </p>
          </div>
          <div className="flex gap-2">
            {template.isDefault && (
              <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand">
                Default
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Colors Section */}
        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
            <CardDescription>Brand color scheme for reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg border border-border"
                    style={{ backgroundColor: template.primaryColor }}
                  />
                  <span className="font-mono text-sm text-text-secondary">
                    {template.primaryColor}
                  </span>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg border border-border"
                    style={{ backgroundColor: template.secondaryColor }}
                  />
                  <span className="font-mono text-sm text-text-secondary">
                    {template.secondaryColor}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Section */}
        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Font settings for reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Font Family
              </label>
              <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
                <span className="text-text-primary" style={{ fontFamily: template.fontFamily }}>
                  {template.fontFamily}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Institution Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Institution Details</CardTitle>
            <CardDescription>Information displayed on reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Institution Name
                </label>
                <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
                  <span className="text-text-primary">{template.institutionName}</span>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  Address
                </label>
                <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
                  <span className="text-text-primary">{template.institutionAddress}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Footer</CardTitle>
            <CardDescription>Footer text displayed on reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-surface-muted px-4 py-3">
              <span className="text-text-primary">{template.footerText}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
        <Button variant="ghost" asChild>
          <Link href="/brand-templates">
            Back to Templates
          </Link>
        </Button>
        <div className="flex gap-3">
          <Button variant="outline">
            Preview PDF
          </Button>
          <Button>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
