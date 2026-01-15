'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { usePreferences, type Theme } from '@/lib/preferences/preferences-context';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

// Mock templates for development
const mockTemplates: Template[] = [
  { id: 'tpl-001', name: 'Chest X-Ray Standard', modality: 'X-Ray', bodyPart: 'Chest', isGlobal: true },
  { id: 'tpl-002', name: 'CT Abdomen', modality: 'CT', bodyPart: 'Abdomen', isGlobal: true },
  { id: 'tpl-003', name: 'MRI Brain', modality: 'MRI', bodyPart: 'Head', isGlobal: false },
];

function getStorageKey(userId: string | undefined): string {
  return userId ? `ai-rad-templates-${userId}` : 'ai-rad-templates';
}

function getStoredTemplates(userId: string | undefined): Template[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(getStorageKey(userId));
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export default function SettingsPage() {
  const { user } = useAuth();
  const { preferences, updatePreference, resolvedTheme, isLoading } = usePreferences();
  const { showToast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Handle hash navigation (wait until preferences are loaded)
  useHashScroll(!isLoading);

  // Load templates for default template selector
  useEffect(() => {
    const storedTemplates = getStoredTemplates(user?.id);
    const storedIds = new Set(storedTemplates.map(t => t.id));
    const combinedTemplates = [
      ...storedTemplates,
      ...mockTemplates.filter(t => !storedIds.has(t.id)),
    ];
    setTemplates(combinedTemplates);
  }, [user?.id]);

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="animate-pulse text-text-secondary">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-text-secondary">Manage your preferences and account settings</p>
      </div>

      <div className="space-y-6">
        {/* Appearance/Preferences Section */}
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
                    <span className="mr-2">☀️</span>
                    Light
                  </Button>
                  <Button
                    variant={preferences.theme === 'dark' ? 'primary' : 'outline'}
                    onClick={() => handleThemeChange('dark')}
                    disabled={saving === 'theme'}
                    data-testid="theme-dark"
                  >
                    <span className="mr-2">🌙</span>
                    Dark
                  </Button>
                  <Button
                    variant={preferences.theme === 'system' ? 'primary' : 'outline'}
                    onClick={() => handleThemeChange('system')}
                    disabled={saving === 'theme'}
                    data-testid="theme-system"
                  >
                    <span className="mr-2">💻</span>
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

        {/* Editor Settings */}
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

        {/* Report Generation Settings */}
        <Card id="reports">
          <CardHeader>
            <CardTitle>Report Generation</CardTitle>
            <CardDescription>Configure default template for report generation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="label mb-2 block">Default Template</label>
                <select
                  value={preferences.defaultTemplate || ''}
                  onChange={(e) => handleDefaultTemplateChange(e.target.value)}
                  disabled={saving === 'defaultTemplate'}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  data-testid="default-template-select"
                >
                  <option value="">No default template</option>
                  <optgroup label="Personal Templates">
                    {templates.filter(t => !t.isGlobal).map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.modality} - {template.bodyPart})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Global Templates">
                    {templates.filter(t => t.isGlobal).map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} ({template.modality} - {template.bodyPart})
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="mt-2 text-sm text-text-muted">
                  This template will be pre-selected when generating new reports
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
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

        {/* Account Info */}
        <Card id="account">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label text-sm">Name</label>
                  <p className="text-text-primary" data-testid="user-name">{user?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="label text-sm">Email</label>
                  <p className="text-text-primary" data-testid="user-email">{user?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="label text-sm">Role</label>
                  <p className="text-text-primary capitalize" data-testid="user-role">{user?.role || 'N/A'}</p>
                </div>
                <div>
                  <label className="label text-sm">User ID</label>
                  <p className="text-text-muted text-xs" data-testid="user-id">{user?.id || 'N/A'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
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
      </div>
    </div>
  );
}
