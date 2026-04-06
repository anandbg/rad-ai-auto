'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface GlobalTemplate {
  id: string;
  name: string;
  modality: string;
  body_part: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<GlobalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase
      .from('templates_global')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading global templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleTogglePublish = async (template: GlobalTemplate) => {
    setActionLoading(template.id);
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase
      .from('templates_global')
      .update({ is_published: !template.is_published })
      .eq('id', template.id);

    if (error) {
      console.error('Error updating template:', error);
    } else {
      await loadTemplates();
    }
    setActionLoading(null);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    setActionLoading(templateId);
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase
      .from('templates_global')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error('Error deleting template:', error);
    } else {
      await loadTemplates();
    }
    setActionLoading(null);
  };

  const publishedTemplates = templates.filter(t => t.is_published);
  const draftTemplates = templates.filter(t => !t.is_published);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent mx-auto" />
          <p className="text-text-secondary">Loading templates...</p>
        </div>
      </div>
    );
  }

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
        <Link href="/admin/templates/new">
          <Button>
            + Create Template
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-text-secondary">No global templates yet.</p>
            <p className="mt-2 text-sm text-text-muted">
              Create your first global template to make it available to all users.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Published Templates */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">
              Published ({publishedTemplates.length})
            </h2>
            {publishedTemplates.length === 0 ? (
              <p className="text-sm text-text-muted">No published templates</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {publishedTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{template.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {template.description || 'No description'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium">
                          {template.modality}
                        </span>
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium">
                          {template.body_part}
                        </span>
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          Published
                        </span>
                      </div>
                    </CardHeader>
                    <CardFooter className="gap-2">
                      <Link href={`/admin/templates/${template.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-warning"
                        onClick={() => handleTogglePublish(template)}
                        disabled={actionLoading === template.id}
                      >
                        {actionLoading === template.id ? 'Updating...' : 'Unpublish'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger"
                        onClick={() => handleDelete(template.id)}
                        disabled={actionLoading === template.id}
                      >
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
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
                            {template.description || 'No description'}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium">
                          {template.modality}
                        </span>
                        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium">
                          {template.body_part}
                        </span>
                        <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                          Draft
                        </span>
                      </div>
                    </CardHeader>
                    <CardFooter className="gap-2">
                      <Link href={`/admin/templates/${template.id}`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleTogglePublish(template)}
                        disabled={actionLoading === template.id}
                      >
                        {actionLoading === template.id ? 'Publishing...' : 'Publish'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-danger"
                        onClick={() => handleDelete(template.id)}
                        disabled={actionLoading === template.id}
                      >
                        Delete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
