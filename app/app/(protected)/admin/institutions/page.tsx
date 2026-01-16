'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

// Institution interface
interface Institution {
  id: string;
  name: string;
  logoUrl?: string;
  address?: string;
  billingEmail: string;
  memberCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Storage key for institutions
const INSTITUTIONS_KEY = 'ai-rad-institutions';
const INSTITUTION_MEMBERS_KEY = 'ai-rad-institution-members';
const INSTITUTION_TEMPLATES_KEY = 'ai-rad-institution-templates';

// Helper to get institutions from localStorage
function getInstitutions(): Institution[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(INSTITUTIONS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Helper to save institutions to localStorage
function saveInstitutions(institutions: Institution[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INSTITUTIONS_KEY, JSON.stringify(institutions));
}

export default function InstitutionsPage() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Institution | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    address: '',
    billingEmail: '',
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Load institutions on mount
  useEffect(() => {
    const loadedInstitutions = getInstitutions();
    setInstitutions(loadedInstitutions);
  }, []);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Validate form
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) {
      errors.name = 'Institution name is required';
    } else if (formData.name.trim().length < 3) {
      errors.name = 'Institution name must be at least 3 characters';
    }
    if (!formData.billingEmail.trim()) {
      errors.billingEmail = 'Billing email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.billingEmail)) {
      errors.billingEmail = 'Invalid email format';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create institution
  const handleCreate = () => {
    if (!validateForm()) return;

    const newInstitution: Institution = {
      id: `inst-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: formData.name.trim(),
      logoUrl: formData.logoUrl.trim() || undefined,
      address: formData.address.trim() || undefined,
      billingEmail: formData.billingEmail.trim(),
      memberCount: 0,
      createdBy: user?.id || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedInstitutions = [...institutions, newInstitution];
    saveInstitutions(updatedInstitutions);
    setInstitutions(updatedInstitutions);

    // Reset form and close dialog
    setFormData({ name: '', logoUrl: '', address: '', billingEmail: '' });
    setFormErrors({});
    setShowCreateDialog(false);

    showToast(`Institution "${newInstitution.name}" created successfully!`, 'success');
  };

  // Handle delete institution (with cascade delete of members and templates)
  const handleDelete = () => {
    if (!deleteTarget) return;

    // Delete institution from list
    const updatedInstitutions = institutions.filter(i => i.id !== deleteTarget.id);
    saveInstitutions(updatedInstitutions);
    setInstitutions(updatedInstitutions);

    // Cascade delete: Remove all members of this institution
    const membersData = localStorage.getItem(INSTITUTION_MEMBERS_KEY);
    if (membersData) {
      try {
        const allMembers = JSON.parse(membersData);
        const remainingMembers = allMembers.filter(
          (member: { institutionId: string }) => member.institutionId !== deleteTarget.id
        );
        localStorage.setItem(INSTITUTION_MEMBERS_KEY, JSON.stringify(remainingMembers));
        console.log(`[CASCADE DELETE] Removed ${allMembers.length - remainingMembers.length} member(s) from institution ${deleteTarget.id}`);
      } catch {
        console.error('Failed to cascade delete institution members');
      }
    }

    // Cascade delete: Remove all institution templates
    const templatesData = localStorage.getItem(INSTITUTION_TEMPLATES_KEY);
    if (templatesData) {
      try {
        const allTemplates = JSON.parse(templatesData);
        const remainingTemplates = allTemplates.filter(
          (template: { institutionId: string }) => template.institutionId !== deleteTarget.id
        );
        localStorage.setItem(INSTITUTION_TEMPLATES_KEY, JSON.stringify(remainingTemplates));
        console.log(`[CASCADE DELETE] Removed ${allTemplates.length - remainingTemplates.length} template(s) from institution ${deleteTarget.id}`);
      } catch {
        console.error('Failed to cascade delete institution templates');
      }
    }

    showToast(`Institution "${deleteTarget.name}" and all associated data deleted successfully!`, 'success');
    setDeleteTarget(null);
    setShowDeleteDialog(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">Loading...</div>
          <p className="text-text-secondary">Loading institutions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <div className="mb-4 text-5xl">403</div>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">Access Denied</h3>
          <p className="mb-4 text-sm text-text-secondary">
            You don&apos;t have permission to access this page.
          </p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Create Institution Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Institution</DialogTitle>
            <DialogDescription>
              Add a new institution to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label htmlFor="inst-name" className="block text-sm font-medium text-text-primary mb-1">
                Institution Name *
              </label>
              <Input
                id="inst-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., City Medical Center"
                data-testid="inst-name-input"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-danger">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="inst-email" className="block text-sm font-medium text-text-primary mb-1">
                Billing Email *
              </label>
              <Input
                id="inst-email"
                type="email"
                value={formData.billingEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, billingEmail: e.target.value }))}
                placeholder="billing@institution.com"
                data-testid="inst-email-input"
              />
              {formErrors.billingEmail && (
                <p className="mt-1 text-sm text-danger">{formErrors.billingEmail}</p>
              )}
            </div>
            <div>
              <label htmlFor="inst-address" className="block text-sm font-medium text-text-primary mb-1">
                Address
              </label>
              <Textarea
                id="inst-address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Medical Drive, City, State 12345"
                rows={2}
                data-testid="inst-address-input"
              />
            </div>
            <div>
              <label htmlFor="inst-logo" className="block text-sm font-medium text-text-primary mb-1">
                Logo URL
              </label>
              <Input
                id="inst-logo"
                value={formData.logoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
                data-testid="inst-logo-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} data-testid="create-inst-submit">
              Create Institution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Institution</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} data-testid="delete-inst-confirm">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
            <Link href="/admin" className="hover:text-text-primary">Admin</Link>
            <span>/</span>
            <span className="text-text-primary">Institutions</span>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Institution Management</h1>
          <p className="mt-1 text-text-secondary">
            Create and manage institutions in the system
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="create-inst-btn">
          + Create Institution
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-3xl font-bold text-text-primary" data-testid="total-institutions">
            {institutions.length}
          </div>
          <div className="text-sm text-text-secondary">Total Institutions</div>
        </Card>
        <Card className="p-4">
          <div className="text-3xl font-bold text-text-primary">
            {institutions.reduce((sum, i) => sum + i.memberCount, 0)}
          </div>
          <div className="text-sm text-text-secondary">Total Members</div>
        </Card>
        <Card className="p-4">
          <div className="text-3xl font-bold text-text-primary">
            {institutions.filter(i => i.memberCount > 0).length}
          </div>
          <div className="text-sm text-text-secondary">Active Institutions</div>
        </Card>
      </div>

      {/* Institutions List */}
      {institutions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-5xl mb-4">🏢</div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No Institutions Yet</h3>
            <p className="text-text-secondary text-sm mb-4">
              Create your first institution to get started
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              Create Institution
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {institutions.map((institution) => (
            <Card key={institution.id} data-testid={`institution-card-${institution.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {institution.logoUrl ? (
                      <img
                        src={institution.logoUrl}
                        alt={`${institution.name} logo`}
                        className="w-16 h-16 rounded-lg object-cover bg-surface-muted"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-brand/10 flex items-center justify-center text-2xl">
                        🏢
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-text-primary" data-testid="inst-name">
                        {institution.name}
                      </h3>
                      <p className="text-sm text-text-secondary">{institution.billingEmail}</p>
                      {institution.address && (
                        <p className="text-sm text-text-muted mt-1">{institution.address}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                        <span>{institution.memberCount} members</span>
                        <span>Created {new Date(institution.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/institutions/${institution.id}`}>Edit</Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteTarget(institution);
                        setShowDeleteDialog(true);
                      }}
                      data-testid={`delete-inst-${institution.id}`}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
