'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { MinyanCard } from '@/components/minyan';
import { Button, Spinner, Select } from '@/components/ui';
import { minyanEventService, buildingService } from '@/services/firebase-services';
import { MinyanEvent, Building, PrayerType } from '@/types';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

export default function MinyaninPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [events, setEvents] = useState<MinyanEvent[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedPrayerType, setSelectedPrayerType] = useState<PrayerType | 'all'>('all');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

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

  useEffect(() => {
    async function fetchEvents() {
      if (!selectedBuildingId) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const dateStr = format(selectedDay, 'yyyy-MM-dd');
        const eventsData = await minyanEventService.getEventsForBuilding(
          selectedBuildingId,
          dateStr
        );

        // Filter by prayer type if selected
        let filteredEvents = eventsData;
        if (selectedPrayerType !== 'all') {
          filteredEvents = eventsData.filter(
            (e) => e.prayerType === selectedPrayerType
          );
        }

        setEvents(filteredEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEvents();
  }, [selectedBuildingId, selectedDay, selectedPrayerType]);

  const goToPreviousWeek = () => setCurrentWeekStart((d) => subWeeks(d, 1));
  const goToNextWeek = () => setCurrentWeekStart((d) => addWeeks(d, 1));
  const goToCurrentWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
    setSelectedDay(new Date());
  };

  const isToday = (date: Date) =>
    format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isSelected = (date: Date) =>
    format(date, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');

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
          <h1 className="text-2xl font-bold text-gray-900">Minyanim</h1>
          <p className="text-gray-600 mt-1">Browse and RSVP to upcoming minyanim</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Building selector */}
        {buildings.length > 1 && (
          <Select
            options={buildings.map((b) => ({ value: b.id, label: b.name }))}
            value={selectedBuildingId || ''}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
          />
        )}

        {/* Prayer type filter */}
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <Select
            options={[
              { value: 'all', label: 'All Prayers' },
              { value: 'Shacharis', label: 'Shacharis' },
              { value: 'Mincha', label: 'Mincha' },
              { value: 'Maariv', label: 'Maariv' },
            ]}
            value={selectedPrayerType}
            onChange={(e) =>
              setSelectedPrayerType(e.target.value as PrayerType | 'all')
            }
          />
        </div>
      </div>

      {/* Week navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={goToCurrentWeek}
              className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg"
            >
              This Week
            </button>
            <span className="text-gray-900 font-medium">
              {format(currentWeekStart, 'MMM d')} -{' '}
              {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </div>

          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Day selector */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={`p-3 rounded-lg text-center transition-colors ${
                isSelected(day)
                  ? 'bg-primary-600 text-white'
                  : isToday(day)
                  ? 'bg-primary-100 text-primary-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="text-xs font-medium uppercase">
                {format(day, 'EEE')}
              </div>
              <div className="text-lg font-semibold">{format(day, 'd')}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected day header */}
      <div className="flex items-center gap-2 mb-4">
        <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900">
          {isToday(selectedDay) ? 'Today' : format(selectedDay, 'EEEE, MMMM d')}
        </h2>
      </div>

      {/* Events */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Minyanim Found
          </h3>
          <p className="text-gray-600">
            {selectedPrayerType !== 'all'
              ? `No ${selectedPrayerType} minyanim scheduled for this day.`
              : 'No minyanim scheduled for this day.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <MinyanCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
