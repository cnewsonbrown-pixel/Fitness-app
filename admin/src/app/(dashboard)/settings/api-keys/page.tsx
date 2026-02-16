'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Plus,
  Key,
  Copy,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Clock,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { PageHeader } from '@/components/layout/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { apiKeysApi, CreateApiKeyData } from '@/lib/api/api-keys.api';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800',
};

const defaultPermissions = [
  { key: 'members:read', label: 'Read Members', description: 'View member data' },
  { key: 'members:write', label: 'Write Members', description: 'Create and update members' },
  { key: 'bookings:read', label: 'Read Bookings', description: 'View booking data' },
  { key: 'bookings:write', label: 'Write Bookings', description: 'Create and manage bookings' },
  { key: 'classes:read', label: 'Read Classes', description: 'View class schedules' },
  { key: 'classes:write', label: 'Write Classes', description: 'Manage class schedules' },
  { key: 'billing:read', label: 'Read Billing', description: 'View billing data' },
  { key: 'billing:write', label: 'Write Billing', description: 'Process payments' },
  { key: 'analytics:read', label: 'Read Analytics', description: 'View analytics data' },
];

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [newSecret, setNewSecret] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<CreateApiKeyData>({
    name: '',
    permissions: [],
    expiresAt: '',
  });

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => apiKeysApi.list({ limit: 50 }),
  });

  const { data: permissions } = useQuery({
    queryKey: ['api-key-permissions'],
    queryFn: () => apiKeysApi.getPermissions(),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateApiKeyData) => apiKeysApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewSecret(response.secretKey);
      setShowCreateDialog(false);
      setShowSecretDialog(true);
      setFormData({ name: '', permissions: [], expiresAt: '' });
    },
    onError: () => {
      toast.error('Failed to create API key');
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key revoked');
    },
    onError: () => {
      toast.error('Failed to revoke API key');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      toast.success('API key deleted');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete API key');
    },
  });

  const rotateMutation = useMutation({
    mutationFn: (id: string) => apiKeysApi.rotate(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setNewSecret(response.secretKey);
      setShowSecretDialog(true);
    },
    onError: () => {
      toast.error('Failed to rotate API key');
    },
  });

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const availablePermissions = permissions || defaultPermissions;

  return (
    <div className="space-y-6">
      <PageHeader title="API Keys" description="Manage API keys for integrations">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : apiKeys?.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Key className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No API keys</h3>
            <p className="text-muted-foreground">Create an API key to integrate with external services</p>
            <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys?.data.map((key) => (
            <Card key={key.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{key.name}</h3>
                        <StatusBadge
                          status={key.isActive ? 'active' : 'inactive'}
                          colorMap={statusColors}
                        />
                      </div>
                      <div className="mt-1 flex items-center gap-2 font-mono text-sm text-muted-foreground">
                        <span>{key.keyPrefix}...</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(key.keyPrefix + '...')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {key.permissions.map((perm) => (
                          <span
                            key={perm}
                            className="rounded bg-muted px-2 py-0.5 text-xs"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {key.isActive && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rotateMutation.mutate(key.id)}
                          disabled={rotateMutation.isPending}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Rotate
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeMutation.mutate(key.id)}
                        >
                          Revoke
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(key.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Created {format(new Date(key.createdAt), 'MMM d, yyyy')}
                  </div>
                  {key.lastUsedAt && (
                    <div className="flex items-center gap-1">
                      Last used {format(new Date(key.lastUsedAt), 'MMM d, yyyy')}
                    </div>
                  )}
                  {key.expiresAt && (
                    <div className="flex items-center gap-1">
                      Expires {format(new Date(key.expiresAt), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Create a new API key with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Key Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Production Integration"
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="max-h-48 overflow-auto rounded border p-3 space-y-2">
                {availablePermissions.map((perm) => (
                  <div key={perm.key} className="flex items-start space-x-3">
                    <Checkbox
                      id={perm.key}
                      checked={formData.permissions.includes(perm.key)}
                      onCheckedChange={() => togglePermission(perm.key)}
                    />
                    <div>
                      <label htmlFor={perm.key} className="text-sm font-medium cursor-pointer">
                        {perm.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{perm.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiration (optional)</Label>
              <Input
                id="expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={createMutation.isPending || !formData.name || formData.permissions.length === 0}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your secret key now. You won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              This is the only time your secret key will be displayed. Store it securely.
            </AlertDescription>
          </Alert>
          <div className="flex items-center gap-2 rounded-lg border bg-muted p-3 font-mono text-sm">
            <span className="flex-1 break-all">{newSecret}</span>
            <Button variant="ghost" size="icon" onClick={() => copyToClipboard(newSecret)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSecretDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete API Key"
        description="Are you sure you want to delete this API key? Any integrations using this key will stop working."
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
