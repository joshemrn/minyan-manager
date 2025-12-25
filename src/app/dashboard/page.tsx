'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, subDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { MinyanCard } from '@/components/minyan';
import { Button, Spinner, Modal, Badge } from '@/components/ui';
import { minyanEventService, buildingService } from '@/services/firebase-services';
import { MinyanEvent, Building } from '@/types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  PlusIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import CreateMinyanForm from '@/components/minyan/CreateMinyanForm';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<MinyanEvent[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch user's buildings
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
        if (userBuildings.length > 0 && !selectedBuildingId) {
          setSelectedBuildingId(userBuildings[0].id);
        }
      } catch (error) {
        console.error('Error fetching buildings:', error);
      }
    }

    if (user) {
      fetchBuildings();
    }
  }, [user]);

  // Subscribe to events for selected building and date
  useEffect(() => {
    if (!selectedBuildingId) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const unsubscribe = minyanEventService.subscribeToEvents(
      selectedBuildingId,
      dateStr,
      (newEvents) => {
        setEvents(newEvents);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedBuildingId, selectedDate]);

  const goToPreviousDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(new Date());

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const selectedBuilding = buildings.find((b) => b.id === selectedBuildingId);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Header with gradient */}
      <div className="relative mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <CalendarDaysIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isToday ? "Today's Minyanim" : format(selectedDate, 'EEEE, MMMM d')}
                </h1>
                {selectedBuilding && (
                  <p className="text-gray-500 text-sm flex items-center mt-0.5">
                    <BuildingOffice2Icon className="h-4 w-4 mr-1" />
                    {selectedBuilding.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {isAdmin && selectedBuildingId && (
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="shadow-lg shadow-primary-500/25"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Minyan
            </Button>
          )}
        </div>
      </div>

      {/* No buildings state */}
      {user && user.buildingIds.length === 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center mx-auto mb-6">
            <BuildingOffice2Icon className="h-8 w-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Join a Building
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            You haven&apos;t joined any buildings yet. Join or create one to start seeing and joining minyanim.
          </p>
          <Link href="/buildings">
            <Button size="lg">
              <PlusIcon className="h-5 w-5 mr-2" />
              Browse Buildings
            </Button>
          </Link>
        </div>
      )}

      {/* Building selector tabs */}
      {buildings.length > 1 && (
        <div className="mb-6 flex gap-2 flex-wrap bg-gray-100 p-1.5 rounded-xl w-fit">
          {buildings.map((building) => (
            <button
              key={building.id}
              onClick={() => setSelectedBuildingId(building.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedBuildingId === building.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {building.name}
            </button>
          ))}
        </div>
      )}

      {/* Date navigation - enhanced */}
      {selectedBuildingId && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-2 mb-8 shadow-sm">
          <button
            onClick={goToPreviousDay}
            className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={goToToday}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                isToday
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Today
            </button>
            <span className="text-gray-900 font-semibold">
              {format(selectedDate, 'MMMM d, yyyy')}
            </span>
          </div>

          <button
            onClick={goToNextDay}
            className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Next day"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      )}

      {/* Events list */}
      {selectedBuildingId && (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-500">Loading minyanim...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center mx-auto mb-6">
                <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Minyanim Scheduled
              </h2>
              <p className="text-gray-600 mb-6">
                There are no minyanim scheduled for this date.
              </p>
              {isAdmin && (
                <Button onClick={() => setShowCreateModal(true)} size="lg">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Schedule One Now
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <MinyanCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Minyan Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Minyan"
        size="md"
      >
        {selectedBuildingId && (
          <CreateMinyanForm
            buildingId={selectedBuildingId}
            onSuccess={() => setShowCreateModal(false)}
            onCancel={() => setShowCreateModal(false)}
          />
        )}
      </Modal>
    </AppLayout>
  );
}
