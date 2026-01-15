'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

// Invite interface
interface InstitutionInvite {
  id: string;
  institutionId: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
}

// Member interface
interface InstitutionMember {
  id: string;
  institutionId: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'member' | 'admin';
  joinedAt: string;
}

// Storage keys
const INSTITUTIONS_KEY = 'ai-rad-institutions';
const INVITES_KEY = 'ai-rad-institution-invites';
const MEMBERS_KEY = 'ai-rad-institution-members';

// Helper functions
function getInstitutions(): Institution[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(INSTITUTIONS_KEY);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch { return []; }
}

function saveInstitutions(institutions: Institution[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(INSTITUTIONS_KEY, JSON.stringify(institutions));
}

function getInvites(institutionId: string): InstitutionInvite[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(INVITES_KEY);
  if (!stored) return [];
  try {
    const allInvites: InstitutionInvite[] = JSON.parse(stored);
    return allInvites.filter(i => i.institutionId === institutionId);
  } catch { return []; }
}

function saveInvite(invite: InstitutionInvite) {
  if (typeof window === 'undefined') return;
  const stored = localStorage.getItem(INVITES_KEY);
  const allInvites: InstitutionInvite[] = stored ? JSON.parse(stored) : [];
  allInvites.push(invite);
  localStorage.setItem(INVITES_KEY, JSON.stringify(allInvites));
}

function getMembers(institutionId: string): InstitutionMember[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(MEMBERS_KEY);
  if (!stored) return [];
  try {
    const allMembers: InstitutionMember[] = JSON.parse(stored);
    return allMembers.filter(m => m.institutionId === institutionId);
  } catch { return []; }
}

export default function InstitutionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();
  const id = params.id as string;

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [invites, setInvites] = useState<InstitutionInvite[]>([]);
  const [members, setMembers] = useState<InstitutionMember[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    billingEmail: '',
    address: '',
    logoUrl: '',
  });

  // Load data on mount
  useEffect(() => {
    const institutions = getInstitutions();
    const foundInstitution = institutions.find(i => i.id === id);
    if (foundInstitution) {
      setInstitution(foundInstitution);
      setFormData({
        name: foundInstitution.name,
        billingEmail: foundInstitution.billingEmail,
        address: foundInstitution.address || '',
        logoUrl: foundInstitution.logoUrl || '',
      });
      setInvites(getInvites(id));
      setMembers(getMembers(id));
    }
    setIsLoadingData(false);
  }, [id]);

  const isAdmin = user?.role === 'admin';

  // Handle invite
  const handleInvite = () => {
    setInviteError('');

    if (!inviteEmail.trim()) {
      setInviteError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      setInviteError('Invalid email format');
      return;
    }

    // Check if already invited
    if (invites.some(i => i.email === inviteEmail && i.status === 'pending')) {
      setInviteError('This email has already been invited');
      return;
    }

    // Create invite
    const newInvite: InstitutionInvite = {
      id: `invite-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      institutionId: id,
      email: inviteEmail.trim(),
      status: 'pending',
      invitedBy: user?.id || 'unknown',
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    saveInvite(newInvite);
    setInvites(prev => [...prev, newInvite]);
    setInviteEmail('');
    setShowInviteDialog(false);

    // Log the invite email to console (development mode)
    console.log(`[Institution Invite] Email invite sent to: ${newInvite.email}`);
    console.log(`[Institution Invite] Invite link: ${window.location.origin}/invite/${newInvite.id}`);

    showToast(`Invitation sent to ${newInvite.email}!`, 'success');
  };

  // Handle save
  const handleSave = () => {
    if (!institution) return;

    const updatedInstitution: Institution = {
      ...institution,
      name: formData.name,
      billingEmail: formData.billingEmail,
      address: formData.address || undefined,
      logoUrl: formData.logoUrl || undefined,
      updatedAt: new Date().toISOString(),
    };

    const institutions = getInstitutions();
    const index = institutions.findIndex(i => i.id === id);
    if (index >= 0) {
      institutions[index] = updatedInstitution;
      saveInstitutions(institutions);
      setInstitution(updatedInstitution);
      setIsEditing(false);
      showToast('Institution updated successfully!', 'success');
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-4xl">Loading...</div>
          <p className="text-text-secondary">Loading institution...</p>
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
            You don't have permission to access this page.
          </p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
          <div className="mb-4 text-5xl">404</div>
          <h3 className="mb-2 text-lg font-semibold text-text-primary">Institution Not Found</h3>
          <p className="mb-4 text-sm text-text-secondary">
            The institution you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/admin/institutions">Back to Institutions</Link>
          </Button>
        </div>
      </div>
    );
  }

  const pendingInvites = invites.filter(i => i.status === 'pending');

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Invite Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new member to {institution.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label htmlFor="invite-email" className="block text-sm font-medium text-text-primary mb-1">
              Email Address
            </label>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="member@example.com"
              data-testid="invite-email-input"
            />
            {inviteError && (
              <p className="mt-1 text-sm text-danger">{inviteError}</p>
            )}
            <p className="mt-2 text-xs text-text-muted">
              The invited user will receive an email with a link to join this institution.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInviteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} data-testid="send-invite-btn">
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
        <Link href="/admin" className="hover:text-text-primary">Admin</Link>
        <span>/</span>
        <Link href="/admin/institutions" className="hover:text-text-primary">Institutions</Link>
        <span>/</span>
        <span className="text-text-primary">{institution.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          {institution.logoUrl ? (
            <img
              src={institution.logoUrl}
              alt={`${institution.name} logo`}
              className="w-20 h-20 rounded-xl object-cover bg-surface-muted"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-brand/10 flex items-center justify-center text-4xl">
              🏢
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text-primary" data-testid="institution-name">
              {institution.name}
            </h1>
            <p className="text-text-secondary">{institution.billingEmail}</p>
            {institution.address && (
              <p className="text-sm text-text-muted mt-1">{institution.address}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Cancel' : 'Edit'}
          </Button>
          <Button onClick={() => setShowInviteDialog(true)} data-testid="invite-member-btn">
            + Invite Member
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Edit Institution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Billing Email</label>
              <Input
                type="email"
                value={formData.billingEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, billingEmail: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Address</label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">Logo URL</label>
              <Input
                value={formData.logoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-3xl font-bold text-text-primary">{members.length}</div>
          <div className="text-sm text-text-secondary">Members</div>
        </Card>
        <Card className="p-4">
          <div className="text-3xl font-bold text-text-primary" data-testid="pending-invites-count">
            {pendingInvites.length}
          </div>
          <div className="text-sm text-text-secondary">Pending Invites</div>
        </Card>
        <Card className="p-4">
          <div className="text-3xl font-bold text-text-primary">
            {new Date(institution.createdAt).toLocaleDateString()}
          </div>
          <div className="text-sm text-text-secondary">Created</div>
        </Card>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pending Invites</CardTitle>
            <CardDescription>
              {pendingInvites.length} invitation{pendingInvites.length !== 1 ? 's' : ''} awaiting response
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" data-testid="pending-invites-list">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-muted"
                  data-testid={`pending-invite-${invite.id}`}
                >
                  <div>
                    <p className="font-medium text-text-primary">{invite.email}</p>
                    <p className="text-xs text-text-muted">
                      Invited {new Date(invite.invitedAt).toLocaleDateString()} ·
                      Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-warning/10 text-warning">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            {members.length === 0
              ? 'No members yet. Invite someone to get started!'
              : `${members.length} member${members.length !== 1 ? 's' : ''} in this institution`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-text-muted">No members yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowInviteDialog(true)}
              >
                Invite First Member
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-muted"
                >
                  <div>
                    <p className="font-medium text-text-primary">{member.userName}</p>
                    <p className="text-sm text-text-muted">{member.userEmail}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    member.role === 'admin'
                      ? 'bg-brand/10 text-brand'
                      : 'bg-surface text-text-secondary'
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back Link */}
      <div className="mt-8">
        <Button variant="ghost" asChild>
          <Link href="/admin/institutions">← Back to Institutions</Link>
        </Button>
      </div>
    </div>
  );
}
