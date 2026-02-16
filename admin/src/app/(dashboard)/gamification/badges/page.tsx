'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Plus, Edit, Trash2, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/layout/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { badgesApi, CreateBadgeData } from '@/lib/api/gamification.api';
import { Badge as BadgeType } from '@/types';

export default function BadgesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateBadgeData>({
    name: '',
    description: '',
    imageUrl: '',
    pointsRequired: 0,
    criteria: '',
  });

  const { data: badges, isLoading } = useQuery({
    queryKey: ['badges'],
    queryFn: () => badgesApi.list({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateBadgeData) => badgesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.success('Badge created successfully');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create badge');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBadgeData> }) => badgesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.success('Badge updated successfully');
      setEditingBadge(null);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update badge');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => badgesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      toast.success('Badge deleted successfully');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Failed to delete badge');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      pointsRequired: 0,
      criteria: '',
    });
  };

  const handleEdit = (badge: BadgeType) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description || '',
      imageUrl: badge.imageUrl || '',
      pointsRequired: badge.pointsRequired || 0,
      criteria: badge.criteria || '',
    });
  };

  const handleSubmit = () => {
    if (editingBadge) {
      updateMutation.mutate({ id: editingBadge.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const badgeColors = [
    'bg-yellow-100 text-yellow-600 border-yellow-200',
    'bg-blue-100 text-blue-600 border-blue-200',
    'bg-green-100 text-green-600 border-green-200',
    'bg-purple-100 text-purple-600 border-purple-200',
    'bg-pink-100 text-pink-600 border-pink-200',
    'bg-orange-100 text-orange-600 border-orange-200',
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Badges" description="Create and manage achievement badges for members">
        <Dialog open={isCreateOpen || !!editingBadge} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingBadge(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Badge
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBadge ? 'Edit Badge' : 'Create Badge'}</DialogTitle>
              <DialogDescription>
                {editingBadge ? 'Update the badge details' : 'Create a new achievement badge'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Badge Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Early Bird"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe how to earn this badge"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL (optional)</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointsRequired">Points Required (optional)</Label>
                <Input
                  id="pointsRequired"
                  type="number"
                  value={formData.pointsRequired}
                  onChange={(e) => setFormData({ ...formData, pointsRequired: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="criteria">Earning Criteria</Label>
                <Textarea
                  id="criteria"
                  value={formData.criteria}
                  onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                  placeholder="e.g., Attend 5 classes before 7 AM"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingBadge(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending || !formData.name}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingBadge ? 'Update Badge' : 'Create Badge'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : badges?.data.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Award className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No badges yet</h3>
            <p className="text-muted-foreground">Create your first badge to start rewarding members</p>
            <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Badge
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {badges?.data.map((badge, index) => (
            <Card key={badge.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${
                      badgeColors[index % badgeColors.length]
                    }`}
                  >
                    {badge.imageUrl ? (
                      <img src={badge.imageUrl} alt={badge.name} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <Award className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(badge)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(badge.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">{badge.name}</CardTitle>
                <CardDescription className="mt-1 line-clamp-2">{badge.description}</CardDescription>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{badge.awardedCount || 0} earned</span>
                  </div>
                  {badge.pointsRequired ? (
                    <span className="font-medium text-primary">{badge.pointsRequired} pts required</span>
                  ) : null}
                </div>
                {badge.criteria && (
                  <p className="mt-2 text-xs text-muted-foreground">Criteria: {badge.criteria}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Badge"
        description="Are you sure you want to delete this badge? Members who have earned it will keep their badge, but no new members can earn it."
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </div>
  );
}
