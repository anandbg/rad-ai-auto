'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
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

// Seed brand templates (used if no stored templates exist)
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
    // Initialize with seed templates
    localStorage.setItem(getStorageKey(userId), JSON.stringify(seedBrandTemplates));
    return seedBrandTemplates;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Helper to save brand templates
function saveBrandTemplates(templates: BrandTemplate[], userId: string | undefined) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(templates));
}

export default function BrandTemplatesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [brandTemplates, setBrandTemplates] = useState<BrandTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<BrandTemplate | null>(null);

  useEffect(() => {
    const templates = getStoredBrandTemplates(user?.id);
    setBrandTemplates(templates);
    setIsLoading(false);
  }, [user?.id]);

  const openDeleteDialog = (template: BrandTemplate) => {
    setTemplateToDelete(template);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTemplate = () => {
    if (!templateToDelete) return;
    const updatedTemplates = brandTemplates.filter(t => t.id !== templateToDelete.id);
    setBrandTemplates(updatedTemplates);
    saveBrandTemplates(updatedTemplates, user?.id);
    showToast(`Brand template "${templateToDelete.name}" deleted successfully!`, 'success');
    setIsDeleteDialogOpen(false);
    setTemplateToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-secondary">Loading...</p>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Brand Templates</h1>
          <p className="mt-1 text-text-secondary">
            Customize your report branding with logos, colors, and typography
          </p>
        </div>
        <Button asChild data-testid="create-brand-template-button">
          <Link href="/brand-templates/new">
            + Create New
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {brandTemplates.map((template) => (
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
              {!template.isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteDialog(template)}
                  className="text-danger hover:text-danger"
                  data-testid={`delete-brand-template-${template.id}`}
                >
                  Delete
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {brandTemplates.length === 0 && (
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent data-testid="delete-brand-template-dialog">
          <DialogHeader>
            <DialogTitle>Delete Brand Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{templateToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeleteTemplate}
              data-testid="confirm-delete-brand-template-button"
            >
              Delete Brand Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
