'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { usePreferences, type Theme } from '@/lib/preferences/preferences-context';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { PageWrapper } from '@/components/motion/page-wrapper';
import { FadeIn } from '@/components/motion/fade-in';

// Scroll to hash on page load
function useHashScroll(isReady: boolean) {
  useEffect(() => {
    if (!isReady) return;
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.slice(1);
      const element = document.getElementById(hash);
      if (element) {
        // Delay to ensure DOM is fully rendered after loading
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    }
  }, [isReady]);
}

// Template interface matching other pages
interface Template {
  id: string;
  name: string;
  modality: string;
  bodyPart: string;
  isGlobal: boolean;
}

export default function SettingsPage() {
  const { user, updateProfile, signOut } = useAuth();
  const { preferences, updatePreference, resolvedTheme, isLoading } = usePreferences();
  const { showToast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Profile editing state
  const [profileName, setProfileName] = useState('');
  const [profileSpecialty, setProfileSpecialty] = useState('');
  const [profileInstitution, setProfileInstitution] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Initialize profile form with user data
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileSpecialty(user.specialty || '');
      setProfileInstitution(user.institution || '');
    }
  }, [user]);

  // Handle hash navigation (wait until preferences are loaded)
  useHashScroll(!isLoading);

  // Load templates from Supabase
  const loadTemplates = useCallback(async () => {
    if (!user?.id) {
      setTemplatesLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    try {
      // Fetch personal templates
      const { data: personalTemplates } = await supabase
        .from('templates_personal')
        .select('id, name, modality, body_part')
        .eq('user_id', user.id)
        .order('name');

      // Fetch published global templates
      const { data: globalTemplates } = await supabase
        .from('templates_global')
        .select('id, name, modality, body_part')
        .eq('is_published', true)
        .order('name');

      const formattedTemplates: Template[] = [
        ...(personalTemplates || []).map(t => ({
          id: t.id,
          name: t.name,
          modality: t.modality,
          bodyPart: t.body_part,
          isGlobal: false,
        })),
        ...(globalTemplates || []).map(t => ({
          id: t.id,
          name: t.name,
          modality: t.modality,
          bodyPart: t.body_part,
          isGlobal: true,
        })),
      ];

      setTemplates(formattedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleThemeChange = async (newTheme: Theme) => {
    setSaving('theme');
    try {
      await updatePreference('theme', newTheme);
      showToast(`Theme changed to ${newTheme}`, 'success');
    } catch {
      showToast('Failed to save theme preference', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleAutoSaveToggle = async () => {
    setSaving('autoSave');
    try {
      await updatePreference('autoSave', !preferences.autoSave);
      showToast(`Auto-save ${!preferences.autoSave ? 'enabled' : 'disabled'}`, 'success');
    } catch {
      showToast('Failed to save preference', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleCompactModeToggle = async () => {
    setSaving('compactMode');
    try {
      await updatePreference('compactMode', !preferences.compactMode);
      showToast(`Compact mode ${!preferences.compactMode ? 'enabled' : 'disabled'}`, 'success');
    } catch {
      showToast('Failed to save preference', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleDefaultTemplateChange = async (templateId: string) => {
    setSaving('defaultTemplate');
    try {
      const value = templateId === '' ? null : templateId;
      await updatePreference('defaultTemplate', value);
      const templateName = templates.find(t => t.id === templateId)?.name || 'None';
      showToast(`Default template set to ${templateName}`, 'success');
    } catch {
      showToast('Failed to save default template', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      showToast('Name is required', 'error');
      return;
    }
    setSaving('profile');
    try {
      await updateProfile({
        name: profileName.trim(),
        specialty: profileSpecialty.trim(),
        institution: profileInstitution.trim(),
      });
      setIsEditingProfile(false);
      showToast('Profile saved successfully', 'success');
    } catch {
      showToast('Failed to save profile', 'error');
    } finally {
      setSaving(null);
    }
  };

  const handleCancelEditProfile = () => {
    // Reset form to current user values
    if (user) {
      setProfileName(user.name || '');
      setProfileSpecialty(user.specialty || '');
      setProfileInstitution(user.institution || '');
    }
    setIsEditingProfile(false);
  };

  // Delete account and all associated user data
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE' || !user?.id) return;

    setIsDeleting(true);
    try {
      const supabase = createSupabaseBrowserClient();

      // Delete user's personal templates
      await supabase
        .from('templates_personal')
        .delete()
        .eq('user_id', user.id);

      // Delete user's credits ledger entries
      await supabase
        .from('credits_ledger')
        .delete()
        .eq('user_id', user.id);

      // Delete user's subscription
      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id);

      // Delete user's profile
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      // Clear any localStorage preferences
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes(user.id)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => localStorage.removeItem(key));

      console.log(`[CASCADE DELETE] Deleted data for user ${user.id}`);

      // Show success message
      showToast('Account and all data deleted successfully', 'success');

      // Close dialog
      setDeleteDialogOpen(false);
      setDeleteConfirmText('');

      // Sign out after deletion
      await signOut();
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('Failed to delete account', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="animate-pulse text-text-secondary">Loading settings...</div>
      </div>
    );
  }

  return (
    <PageWrapper className="p-6">
      <div className="mx-auto max-w-4xl">
        <FadeIn>
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="mt-2 text-text-secondary">Manage your preferences and account settings</p>
          </header>
        </FadeIn>

        <div className="space-y-6">
          {/* Appearance/Preferences Section */}
          <FadeIn delay={0.1}>
            <Card id="preferences">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how AI Radiologist looks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="label mb-2 block">Theme</label>
                    <div className="flex gap-2" data-testid="theme-selector">
                      <Button
                        variant={preferences.theme === 'light' ? 'primary' : 'outline'}
                        onClick={() => handleThemeChange('light')}
                        disabled={saving === 'theme'}
                        data-testid="theme-light"
                      >
                        <span className="mr-2">*</span>
                        Light
                      </Button>
                      <Button
                        variant={preferences.theme === 'dark' ? 'primary' : 'outline'}
                        onClick={() => handleThemeChange('dark')}
                        disabled={saving === 'theme'}
                        data-testid="theme-dark"
                      >
                        <span className="mr-2">*</span>
                        Dark
                      </Button>
                      <Button
                        variant={preferences.theme === 'system' ? 'primary' : 'outline'}
                        onClick={() => handleThemeChange('system')}
                        disabled={saving === 'theme'}
                        data-testid="theme-system"
                      >
                        <span className="mr-2">*</span>
                        System
                      </Button>
                    </div>
                    <p className="mt-2 text-sm text-text-muted">
                      Current resolved theme: <span data-testid="resolved-theme">{resolvedTheme}</span>
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <label className="label">Compact Mode</label>
                      <p className="text-sm text-text-muted">Use a more compact layout</p>
                    </div>
                    <Button
                      variant={preferences.compactMode ? 'primary' : 'outline'}
                      onClick={handleCompactModeToggle}
                      disabled={saving === 'compactMode'}
                      data-testid="compact-mode-toggle"
                    >
                      {preferences.compactMode ? 'On' : 'Off'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Editor Settings */}
          <FadeIn delay={0.15}>
            <Card id="editor">
              <CardHeader>
                <CardTitle>Editor Settings</CardTitle>
                <CardDescription>Configure report editing behavior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="label">Auto-save</label>
                    <p className="text-sm text-text-muted">Automatically save changes as you type</p>
                  </div>
                  <Button
                    variant={preferences.autoSave ? 'primary' : 'outline'}
                    onClick={handleAutoSaveToggle}
                    disabled={saving === 'autoSave'}
                    data-testid="autosave-toggle"
                  >
                    {preferences.autoSave ? 'On' : 'Off'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Report Generation Settings */}
          <FadeIn delay={0.2}>
            <Card id="reports">
              <CardHeader>
                <CardTitle>Report Generation</CardTitle>
                <CardDescription>Configure default template for report generation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="label mb-2 block">Default Template</label>
                    {templatesLoading ? (
                      <div className="text-sm text-text-muted">Loading templates...</div>
                    ) : (
                      <select
                        value={preferences.defaultTemplate || ''}
                        onChange={(e) => handleDefaultTemplateChange(e.target.value)}
                        disabled={saving === 'defaultTemplate'}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        data-testid="default-template-select"
                      >
                        <option value="">No default template</option>
                        {templates.filter(t => !t.isGlobal).length > 0 && (
                          <optgroup label="Personal Templates">
                            {templates.filter(t => !t.isGlobal).map(template => (
                              <option key={template.id} value={template.id}>
                                {template.name} ({template.modality} - {template.bodyPart})
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {templates.filter(t => t.isGlobal).length > 0 && (
                          <optgroup label="Global Templates">
                            {templates.filter(t => t.isGlobal).map(template => (
                              <option key={template.id} value={template.id}>
                                {template.name} ({template.modality} - {template.bodyPart})
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    )}
                    <p className="mt-2 text-sm text-text-muted">
                      This template will be pre-selected when generating new reports
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Security Section */}
          <FadeIn delay={0.25}>
            <Card id="security">
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="label">Two-Factor Authentication</label>
                      <p className="text-sm text-text-muted">Add an extra layer of security to your account</p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <label className="label">Session Management</label>
                      <p className="text-sm text-text-muted">View and manage active sessions</p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <label className="label">Change Password</label>
                      <p className="text-sm text-text-muted">Update your account password</p>
                    </div>
                    <Button variant="outline" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Profile Section */}
          <FadeIn delay={0.3}>
            <Card id="profile">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Your personal information</CardDescription>
                </div>
                {!isEditingProfile && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingProfile(true)}
                    data-testid="edit-profile-button"
                  >
                    Edit Profile
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="label mb-1 block">Name *</label>
                      <Input
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Dr. John Smith"
                        data-testid="profile-name-input"
                      />
                    </div>
                    <div>
                      <label className="label mb-1 block">Specialty</label>
                      <select
                        value={profileSpecialty}
                        onChange={(e) => setProfileSpecialty(e.target.value)}
                        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                        data-testid="profile-specialty-select"
                      >
                        <option value="">Select a specialty</option>
                        <option value="Diagnostic Radiology">Diagnostic Radiology</option>
                        <option value="Neuroradiology">Neuroradiology</option>
                        <option value="Musculoskeletal Radiology">Musculoskeletal Radiology</option>
                        <option value="Interventional Radiology">Interventional Radiology</option>
                        <option value="Pediatric Radiology">Pediatric Radiology</option>
                        <option value="Nuclear Medicine">Nuclear Medicine</option>
                        <option value="Breast Imaging">Breast Imaging</option>
                        <option value="Abdominal Radiology">Abdominal Radiology</option>
                        <option value="Cardiothoracic Radiology">Cardiothoracic Radiology</option>
                        <option value="Emergency Radiology">Emergency Radiology</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label mb-1 block">Institution</label>
                      <Input
                        value={profileInstitution}
                        onChange={(e) => setProfileInstitution(e.target.value)}
                        placeholder="Hospital or Practice Name"
                        data-testid="profile-institution-input"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="primary"
                        onClick={handleSaveProfile}
                        disabled={saving === 'profile'}
                        data-testid="save-profile-button"
                      >
                        {saving === 'profile' ? 'Saving...' : 'Save Profile'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={handleCancelEditProfile}
                        disabled={saving === 'profile'}
                        data-testid="cancel-edit-profile-button"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label text-sm">Name</label>
                        <p className="text-text-primary" data-testid="user-name">{user?.name || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="label text-sm">Email</label>
                        <p className="text-text-primary" data-testid="user-email">{user?.email || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="label text-sm">Specialty</label>
                        <p className="text-text-primary" data-testid="user-specialty">{user?.specialty || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="label text-sm">Institution</label>
                        <p className="text-text-primary" data-testid="user-institution">{user?.institution || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="label text-sm">Role</label>
                        <p className="text-text-primary capitalize" data-testid="user-role">{user?.role || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="label text-sm">User ID</label>
                        <p className="text-text-muted text-xs" data-testid="user-id">{user?.id || 'Not set'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>

          {/* Debug Info */}
          <FadeIn delay={0.35}>
            <Card>
              <CardHeader>
                <CardTitle>Preferences Debug</CardTitle>
                <CardDescription>Current preference values (for verification)</CardDescription>
              </CardHeader>
              <CardContent>
                <pre
                  className="rounded bg-surface-muted p-4 text-xs overflow-auto"
                  data-testid="preferences-json"
                >
                  {JSON.stringify(preferences, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </FadeIn>

          {/* Danger Zone */}
          <FadeIn delay={0.4}>
            <Card id="danger" className="border-danger/50">
              <CardHeader>
                <CardTitle className="text-danger">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions that affect your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="label">Delete Account</label>
                      <p className="text-sm text-text-muted">
                        Permanently delete your account and all associated data including templates, subscriptions, and preferences.
                      </p>
                    </div>
                    <Button
                      variant="danger"
                      onClick={() => setDeleteDialogOpen(true)}
                      data-testid="delete-account-button"
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* Delete Account Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent data-testid="delete-account-dialog">
            <DialogHeader>
              <DialogTitle className="text-danger">Delete Account</DialogTitle>
              <DialogDescription>
                This action is permanent and cannot be undone. All your data will be deleted including:
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ul className="list-disc list-inside text-sm text-text-secondary space-y-1 mb-4">
                <li>Personal templates</li>
                <li>Subscription and billing data</li>
                <li>Credits and usage history</li>
                <li>Preferences and settings</li>
                <li>Profile information</li>
              </ul>
              <p className="text-sm text-text-primary font-medium mb-2">
                Type <span className="font-mono bg-danger/10 text-danger px-1 rounded">DELETE</span> to confirm:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                data-testid="delete-confirm-input"
              />
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setDeleteDialogOpen(false);
                  setDeleteConfirmText('');
                }}
                data-testid="cancel-delete-account"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                data-testid="confirm-delete-account"
              >
                {isDeleting ? 'Deleting...' : 'Delete My Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
}
