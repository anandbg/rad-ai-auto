'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/ui/toast';

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
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Font family options
const fontFamilyOptions = [
  'Inter',
  'Arial',
  'System',
  'Times New Roman',
  'Georgia',
];

// Storage key for brand templates (user-specific)
function getStorageKey(userId: string | undefined): string {
  return userId ? `ai-rad-brand-templates-${userId}` : 'ai-rad-brand-templates';
}

// Get brand templates from localStorage
function getStoredBrandTemplates(userId: string | undefined): BrandTemplate[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(getStorageKey(userId));
  if (!stored) return [];
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

// Generate unique ID
function generateId(): string {
  return 'bt-' + Math.random().toString(36).substring(2, 9);
}

export default function NewBrandTemplatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    primaryColor: '#7C3AED',
    secondaryColor: '#A78BFA',
    fontFamily: 'Inter',
    fontSize: '12',
    institutionName: '',
    institutionAddress: '',
    footerText: 'This report is confidential and intended for medical professionals only.',
    logoUrl: '',
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Template name must be at least 3 characters';
    }

    if (!formData.institutionName.trim()) {
      newErrors.institutionName = 'Institution name is required';
    }

    // Validate font size is a number between 8 and 24
    const fontSizeNum = parseInt(formData.fontSize, 10);
    if (isNaN(fontSizeNum)) {
      newErrors.fontSize = 'Font size must be a number';
    } else if (fontSizeNum < 8 || fontSizeNum > 24) {
      newErrors.fontSize = 'Font size must be between 8 and 24';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Create new brand template
    const newTemplate: BrandTemplate = {
      id: generateId(),
      name: formData.name.trim(),
      description: formData.description.trim() || 'Custom brand template',
      isDefault: false,
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      fontFamily: formData.fontFamily,
      institutionName: formData.institutionName.trim(),
      institutionAddress: formData.institutionAddress.trim(),
      footerText: formData.footerText.trim(),
      logoUrl: formData.logoUrl.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existingTemplates = getStoredBrandTemplates(user?.id);
    saveBrandTemplates([newTemplate, ...existingTemplates], user?.id);

    // Show success toast
    showToast(`Brand template "${newTemplate.name}" created successfully!`, 'success');

    // Redirect to brand templates list
    router.push('/brand-templates');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/brand-templates" className="hover:text-text-primary">
          Brand Templates
        </Link>
        <span>/</span>
        <span className="text-text-primary">New Template</span>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Create Brand Template</CardTitle>
            <CardDescription>
              Create a custom brand template for your radiology reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary">Basic Information</h3>

              {/* Template Name */}
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-text-primary">
                  Template Name <span className="text-error">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g., My Hospital Brand"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  data-testid="brand-template-name-input"
                  className={errors.name ? 'border-error' : ''}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error">{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-2 block text-sm font-medium text-text-primary">
                  Description
                </label>
                <Input
                  id="description"
                  type="text"
                  placeholder="Brief description of this brand template"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  data-testid="brand-template-description-input"
                />
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary">Logo</h3>
              <div>
                <label htmlFor="logoUrl" className="mb-2 block text-sm font-medium text-text-primary">
                  Logo URL
                </label>
                <Input
                  id="logoUrl"
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={formData.logoUrl}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  data-testid="brand-template-logo-input"
                />
                <p className="mt-1 text-xs text-text-secondary">
                  Enter a URL to your institution&apos;s logo image
                </p>
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary">Colors</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="primaryColor" className="mb-2 block text-sm font-medium text-text-primary">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="primaryColor"
                      value={formData.primaryColor}
                      onChange={(e) => handleChange('primaryColor', e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded border border-border"
                      data-testid="brand-template-primary-color"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => handleChange('primaryColor', e.target.value)}
                      className="w-32 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="secondaryColor" className="mb-2 block text-sm font-medium text-text-primary">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={(e) => handleChange('secondaryColor', e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded border border-border"
                      data-testid="brand-template-secondary-color"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => handleChange('secondaryColor', e.target.value)}
                      className="w-32 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary">Typography</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="fontFamily" className="mb-2 block text-sm font-medium text-text-primary">
                    Font Family
                  </label>
                  <select
                    id="fontFamily"
                    value={formData.fontFamily}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    data-testid="brand-template-font-select"
                  >
                    {fontFamilyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="fontSize" className="mb-2 block text-sm font-medium text-text-primary">
                    Font Size (pt)
                  </label>
                  <Input
                    id="fontSize"
                    type="text"
                    placeholder="12"
                    value={formData.fontSize}
                    onChange={(e) => handleChange('fontSize', e.target.value)}
                    data-testid="brand-template-font-size"
                    className={errors.fontSize ? 'border-error' : ''}
                  />
                  {errors.fontSize && (
                    <p className="mt-1 text-sm text-error" data-testid="font-size-error">{errors.fontSize}</p>
                  )}
                  <p className="mt-1 text-xs text-text-secondary">
                    Enter a number between 8 and 24
                  </p>
                </div>
              </div>
            </div>

            {/* Institution Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary">Institution Details</h3>

              <div>
                <label htmlFor="institutionName" className="mb-2 block text-sm font-medium text-text-primary">
                  Institution Name <span className="text-error">*</span>
                </label>
                <Input
                  id="institutionName"
                  type="text"
                  placeholder="e.g., City Medical Center"
                  value={formData.institutionName}
                  onChange={(e) => handleChange('institutionName', e.target.value)}
                  data-testid="brand-template-institution-name"
                  className={errors.institutionName ? 'border-error' : ''}
                />
                {errors.institutionName && (
                  <p className="mt-1 text-sm text-error">{errors.institutionName}</p>
                )}
              </div>

              <div>
                <label htmlFor="institutionAddress" className="mb-2 block text-sm font-medium text-text-primary">
                  Institution Address
                </label>
                <Input
                  id="institutionAddress"
                  type="text"
                  placeholder="e.g., 123 Healthcare Blvd, Medical City, MC 12345"
                  value={formData.institutionAddress}
                  onChange={(e) => handleChange('institutionAddress', e.target.value)}
                  data-testid="brand-template-institution-address"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-text-primary">Footer</h3>
              <div>
                <label htmlFor="footerText" className="mb-2 block text-sm font-medium text-text-primary">
                  Footer Text
                </label>
                <Textarea
                  id="footerText"
                  placeholder="Enter footer text for reports..."
                  value={formData.footerText}
                  onChange={(e) => handleChange('footerText', e.target.value)}
                  rows={2}
                  data-testid="brand-template-footer-input"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="ghost" asChild>
              <Link href="/brand-templates">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              data-testid="create-brand-template-submit"
            >
              {isSubmitting ? 'Creating...' : 'Create Brand Template'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
