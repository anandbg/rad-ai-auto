'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';

// Brand template interface
interface BrandTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  institutionName: string;
  institutionAddress: string;
  footerText: string;
  createdAt: string;
  updatedAt: string;
}

// Seed brand templates (same as list page)
const seedBrandTemplates: BrandTemplate[] = [
  {
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
  {
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
  {
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
];

// Storage key for brand templates (user-specific)
function getStorageKey(userId: string | undefined): string {
  return userId ? `ai-rad-brand-templates-${userId}` : 'ai-rad-brand-templates';
}

// Get brand templates from localStorage
function getStoredBrandTemplates(userId: string | undefined): BrandTemplate[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(getStorageKey(userId));
  if (!stored) {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(seedBrandTemplates));
    return seedBrandTemplates;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save brand templates to localStorage
function saveBrandTemplates(templates: BrandTemplate[], userId: string | undefined) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(templates));
}

export default function BrandTemplateEditPage() {
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;

  const [template, setTemplate] = useState<BrandTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    primaryColor: '',
    secondaryColor: '',
    fontFamily: '',
    institutionName: '',
    institutionAddress: '',
    footerText: '',
  });

  useEffect(() => {
    const templates = getStoredBrandTemplates(user?.id);
    const found = templates.find(t => t.id === id);
    if (found) {
      setTemplate(found);
      setFormData({
        name: found.name,
        description: found.description,
        primaryColor: found.primaryColor,
        secondaryColor: found.secondaryColor,
        fontFamily: found.fontFamily,
        institutionName: found.institutionName,
        institutionAddress: found.institutionAddress,
        footerText: found.footerText,
      });
    }
    setIsLoading(false);
  }, [id, user?.id]);

  const handleSave = () => {
    if (!template) return;

    setIsSaving(true);

    const updatedTemplate: BrandTemplate = {
      ...template,
      ...formData,
      updatedAt: new Date().toISOString(),
    };

    const templates = getStoredBrandTemplates(user?.id);
    const index = templates.findIndex(t => t.id === id);
    if (index >= 0) {
      templates[index] = updatedTemplate;
    }
    saveBrandTemplates(templates, user?.id);

    setTemplate(updatedTemplate);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <div className="mb-4 text-5xl">404</div>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">Brand Template Not Found</h3>
          <p className="mb-4 text-sm text-text-secondary">
            The brand template you&apos;re looking for doesn&apos;t exist.
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
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} data-testid="edit-brand-template-btn">
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {isEditing ? (
        /* Edit Mode */
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  data-testid="brand-name-input"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
              <CardDescription>Brand color scheme for reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border border-border"
                    data-testid="primary-color-input"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-32 font-mono"
                    data-testid="primary-color-text"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded border border-border"
                  />
                  <Input
                    value={formData.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="w-32 font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Font Family</label>
                <select
                  value={formData.fontFamily}
                  onChange={(e) => handleChange('fontFamily', e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary"
                >
                  <option value="Inter">Inter</option>
                  <option value="Arial">Arial</option>
                  <option value="System">System</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Institution */}
          <Card>
            <CardHeader>
              <CardTitle>Institution Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Institution Name</label>
                <Input
                  value={formData.institutionName}
                  onChange={(e) => handleChange('institutionName', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Address</label>
                <Input
                  value={formData.institutionAddress}
                  onChange={(e) => handleChange('institutionAddress', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Footer Text</label>
                <Textarea
                  value={formData.footerText}
                  onChange={(e) => handleChange('footerText', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} data-testid="save-brand-template-btn">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      ) : (
        /* View Mode */
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
                      data-testid="primary-color-display"
                    />
                    <span className="font-mono text-sm text-text-secondary" data-testid="primary-color-value">
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

          {/* Actions */}
          <div className="lg:col-span-2 flex items-center justify-between border-t border-border pt-6">
            <Button variant="ghost" asChild>
              <Link href="/brand-templates">
                Back to Templates
              </Link>
            </Button>
            <div className="flex gap-3">
              <Button variant="outline">
                Preview PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
