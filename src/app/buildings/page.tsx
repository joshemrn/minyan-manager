'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { Button, Input, Card, CardContent, CardHeader, Spinner, Modal } from '@/components/ui';
import { buildingService, userService } from '@/services/firebase-services';
import { Building } from '@/types';
import {
  BuildingOffice2Icon,
  PlusIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface CreateBuildingForm {
  name: string;
  address: string;
}

interface JoinBuildingForm {
  inviteCode: string;
}

export default function BuildingsPage() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createForm = useForm<CreateBuildingForm>();
  const joinForm = useForm<JoinBuildingForm>();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchBuildings() {
      if (!user || user.buildingIds.length === 0) {
        setBuildings([]);
        setIsLoading(false);
        return;
      }

      try {
        const userBuildings = await buildingService.getUserBuildings(
          user.buildingIds
        );
        setBuildings(userBuildings);
      } catch (error) {
        console.error('Error fetching buildings:', error);
        toast.error('Failed to load buildings');
      } finally {
        setIsLoading(false);
      }
    }

    if (user) {
      fetchBuildings();
    }
  }, [user]);

  const handleCreateBuilding = async (data: CreateBuildingForm) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const inviteCode = buildingService.generateInviteCode();
      const buildingId = await buildingService.createBuilding({
        name: data.name,
        address: data.address,
        inviteCode,
        adminUserIds: [user.id],
      });

      // Add user to building and make them admin
      await userService.joinBuilding(user.id, buildingId);
      await userService.updateUser(user.id, { role: 'admin' });
      
      await refreshUser();
      
      const newBuilding: Building = {
        id: buildingId,
        name: data.name,
        address: data.address,
        inviteCode,
        adminUserIds: [user.id],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setBuildings((prev) => [...prev, newBuilding]);
      toast.success('Building created successfully!');
      setShowCreateModal(false);
      createForm.reset();
    } catch (error) {
      console.error('Error creating building:', error);
      toast.error('Failed to create building');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinBuilding = async (data: JoinBuildingForm) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const building = await buildingService.getBuildingByInviteCode(
        data.inviteCode.toUpperCase()
      );

      if (!building) {
        toast.error('Invalid invite code');
        return;
      }

      if (user.buildingIds.includes(building.id)) {
        toast.error('You are already a member of this building');
        return;
      }

      await userService.joinBuilding(user.id, building.id);
      await refreshUser();
      
      setBuildings((prev) => [...prev, building]);
      toast.success(`Joined ${building.name}!`);
      setShowJoinModal(false);
      joinForm.reset();
    } catch (error) {
      console.error('Error joining building:', error);
      toast.error('Failed to join building');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveBuilding = async (buildingId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to leave this building?')) return;

    try {
      await userService.leaveBuilding(user.id, buildingId);
      await refreshUser();
      setBuildings((prev) => prev.filter((b) => b.id !== buildingId));
      toast.success('Left building successfully');
    } catch (error) {
      console.error('Error leaving building:', error);
      toast.error('Failed to leave building');
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied!');
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied!');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buildings</h1>
          <p className="text-gray-600 mt-1">
            Manage the buildings you&apos;re a member of
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setShowJoinModal(true)}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Join Building
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Building
          </Button>
        </div>
      </div>

      {/* Buildings List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : buildings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <BuildingOffice2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              No Buildings Yet
            </h2>
            <p className="text-gray-600 mb-4">
              Join an existing building with an invite code or create a new one.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="secondary" onClick={() => setShowJoinModal(true)}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Join Building
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Building
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {buildings.map((building) => {
            const isAdmin = building.adminUserIds.includes(user?.id || '');
            return (
              <Card key={building.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {building.name}
                      </h3>
                      <p className="text-sm text-gray-600">{building.address}</p>
                    </div>
                    {isAdmin && (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                        Admin
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Invite Code Section */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invite Code
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono">
                        {building.inviteCode}
                      </code>
                      <button
                        onClick={() => copyInviteCode(building.inviteCode)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy code"
                      >
                        <ClipboardDocumentIcon className="h-5 w-5 text-gray-500" />
                      </button>
                      <button
                        onClick={() => copyInviteLink(building.inviteCode)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy invite link"
                      >
                        <LinkIcon className="h-5 w-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleLeaveBuilding(building.id)}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                      Leave
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Building Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Building"
      >
        <form
          onSubmit={createForm.handleSubmit(handleCreateBuilding)}
          className="space-y-4"
        >
          <Input
            label="Building Name"
            placeholder="e.g., Tech Tower NYC"
            {...createForm.register('name', { required: 'Name is required' })}
            error={createForm.formState.errors.name?.message}
          />
          <Input
            label="Address"
            placeholder="e.g., 123 Main Street, New York, NY"
            {...createForm.register('address', { required: 'Address is required' })}
            error={createForm.formState.errors.address?.message}
          />
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Create Building
            </Button>
          </div>
        </form>
      </Modal>

      {/* Join Building Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join a Building"
      >
        <form
          onSubmit={joinForm.handleSubmit(handleJoinBuilding)}
          className="space-y-4"
        >
          <Input
            label="Invite Code"
            placeholder="e.g., ABC123"
            {...joinForm.register('inviteCode', {
              required: 'Invite code is required',
            })}
            error={joinForm.formState.errors.inviteCode?.message}
          />
          <p className="text-sm text-gray-500">
            Ask a building admin for the invite code to join their building.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowJoinModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Join Building
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
