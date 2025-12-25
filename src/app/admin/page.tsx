'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Spinner,
  Modal,
  Input,
  Badge,
} from '@/components/ui';
import { BulkCreateMinyanForm, CreateMinyanForm } from '@/components/minyan';
import {
  minyanEventService,
  buildingService,
  announcementService,
} from '@/services/firebase-services';
import { MinyanEvent, Building, Announcement } from '@/types';
import {
  CalendarDaysIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface AnnouncementForm {
  title: string;
  message: string;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [events, setEvents] = useState<MinyanEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const announcementForm = useForm<AnnouncementForm>();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !isAdmin) {
      router.push('/dashboard');
      toast.error('You do not have admin access');
    }
  }, [user, authLoading, router, isAdmin]);

  useEffect(() => {
    async function fetchData() {
      if (!user || !isAdmin) return;

      try {
        // Get buildings where user is admin
        const userBuildings = await buildingService.getUserBuildings(
          user.buildingIds
        );
        const adminBuildings = userBuildings.filter((b) =>
          b.adminUserIds.includes(user.id)
        );
        setBuildings(adminBuildings);

        if (adminBuildings.length > 0 && !selectedBuildingId) {
          setSelectedBuildingId(adminBuildings[0].id);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  useEffect(() => {
    async function fetchBuildingData() {
      if (!selectedBuildingId) return;

      setIsLoading(true);
      try {
        const [eventsData, announcementsData] = await Promise.all([
          minyanEventService.getEventsForBuilding(selectedBuildingId),
          announcementService.getAnnouncements(selectedBuildingId),
        ]);
        
        // Only show upcoming events
        const today = format(new Date(), 'yyyy-MM-dd');
        const upcomingEvents = eventsData.filter((e) => e.date >= today);
        
        setEvents(upcomingEvents.slice(0, 20));
        setAnnouncements(announcementsData.slice(0, 5));
      } catch (error) {
        console.error('Error fetching building data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBuildingData();
  }, [selectedBuildingId]);

  const handleCancelEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to cancel this minyan?')) return;

    try {
      await minyanEventService.cancelEvent(eventId);
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, isCancelled: true } : e))
      );
      toast.success('Minyan cancelled');
    } catch (error) {
      console.error('Error cancelling event:', error);
      toast.error('Failed to cancel minyan');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this minyan? This cannot be undone.')) return;

    try {
      await minyanEventService.deleteEvent(eventId);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      toast.success('Minyan deleted');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete minyan');
    }
  };

  const handleDeleteRecurrence = async (recurrenceId: string) => {
    if (!confirm('Are you sure you want to delete ALL events in this recurring series?')) return;

    try {
      await minyanEventService.deleteEventsByRecurrence(recurrenceId);
      setEvents((prev) => prev.filter((e) => e.recurrenceId !== recurrenceId));
      toast.success('Recurring series deleted');
    } catch (error) {
      console.error('Error deleting recurrence:', error);
      toast.error('Failed to delete recurring series');
    }
  };

  const handleCreateAnnouncement = async (data: AnnouncementForm) => {
    if (!user || !selectedBuildingId) return;

    setIsSubmitting(true);
    try {
      await announcementService.createAnnouncement(
        selectedBuildingId,
        data.title,
        data.message,
        user.id
      );
      toast.success('Announcement sent!');
      setShowAnnouncementModal(false);
      announcementForm.reset();
      
      // Refresh announcements
      const newAnnouncements = await announcementService.getAnnouncements(
        selectedBuildingId
      );
      setAnnouncements(newAnnouncements.slice(0, 5));
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to send announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshEvents = async () => {
    if (!selectedBuildingId) return;
    
    const eventsData = await minyanEventService.getEventsForBuilding(
      selectedBuildingId
    );
    const today = format(new Date(), 'yyyy-MM-dd');
    const upcomingEvents = eventsData.filter((e) => e.date >= today);
    setEvents(upcomingEvents.slice(0, 20));
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          {selectedBuilding && (
            <p className="text-gray-600 mt-1">Managing: {selectedBuilding.name}</p>
          )}
        </div>
      </div>

      {/* Building Selector */}
      {buildings.length > 1 && (
        <div className="mb-6 flex gap-2 flex-wrap">
          {buildings.map((building) => (
            <button
              key={building.id}
              onClick={() => setSelectedBuildingId(building.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedBuildingId === building.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {building.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Cog6ToothIcon className="h-5 w-5" />
                  Quick Actions
                </h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  onClick={() => setShowSingleModal(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Single Minyan
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="secondary"
                  onClick={() => setShowBulkModal(true)}
                >
                  <CalendarDaysIcon className="h-4 w-4 mr-2" />
                  Create Recurring Minyanim
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="secondary"
                  onClick={() => setShowAnnouncementModal(true)}
                >
                  <MegaphoneIcon className="h-4 w-4 mr-2" />
                  Send Announcement
                </Button>
              </CardContent>
            </Card>

            {/* Recent Announcements */}
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <MegaphoneIcon className="h-5 w-5" />
                  Recent Announcements
                </h2>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <p className="text-gray-500 text-sm">No announcements yet</p>
                ) : (
                  <div className="space-y-3">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className="border-l-2 border-primary-500 pl-3"
                      >
                        <p className="font-medium text-sm">
                          {announcement.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(announcement.createdAt, 'MMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarDaysIcon className="h-5 w-5" />
                    Upcoming Minyanim
                  </h2>
                  <Badge>{events.length} events</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No upcoming minyanim scheduled
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`py-3 flex items-center justify-between ${
                          event.isCancelled ? 'opacity-50' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{event.prayerType}</span>
                            <Badge variant="default" size="sm">
                              {event.nusach}
                            </Badge>
                            {event.recurrenceId && (
                              <Badge variant="info" size="sm">
                                Recurring
                              </Badge>
                            )}
                            {event.isCancelled && (
                              <Badge variant="danger" size="sm">
                                Cancelled
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {format(new Date(event.date), 'EEE, MMM d')} at{' '}
                            {event.time} • {event.location}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!event.isCancelled && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCancelEvent(event.id)}
                            >
                              Cancel
                            </Button>
                          )}
                          {event.recurrenceId && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                handleDeleteRecurrence(event.recurrenceId!)
                              }
                            >
                              Delete Series
                            </Button>
                          )}
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Create Single Minyan Modal */}
      <Modal
        isOpen={showSingleModal}
        onClose={() => setShowSingleModal(false)}
        title="Create Single Minyan"
        size="md"
      >
        {selectedBuildingId && (
          <CreateMinyanForm
            buildingId={selectedBuildingId}
            onSuccess={() => {
              setShowSingleModal(false);
              refreshEvents();
            }}
            onCancel={() => setShowSingleModal(false)}
          />
        )}
      </Modal>

      {/* Create Bulk Minyanim Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Create Recurring Minyanim"
        size="lg"
      >
        {selectedBuildingId && (
          <BulkCreateMinyanForm
            buildingId={selectedBuildingId}
            onSuccess={() => {
              setShowBulkModal(false);
              refreshEvents();
            }}
            onCancel={() => setShowBulkModal(false)}
          />
        )}
      </Modal>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        title="Send Announcement"
      >
        <form
          onSubmit={announcementForm.handleSubmit(handleCreateAnnouncement)}
          className="space-y-4"
        >
          <Input
            label="Title"
            placeholder="Announcement title"
            {...announcementForm.register('title', { required: 'Title is required' })}
            error={announcementForm.formState.errors.title?.message}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              className="w-full px-4 py-2.5 text-accessible-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={4}
              placeholder="Your message to building members..."
              {...announcementForm.register('message', {
                required: 'Message is required',
              })}
            />
            {announcementForm.formState.errors.message && (
              <p className="mt-1 text-sm text-red-600">
                {announcementForm.formState.errors.message.message}
              </p>
            )}
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAnnouncementModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Send Announcement
            </Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
