'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { MinyanEvent, AttendanceSummary, RSVPStatus } from '@/types';
import { attendanceService } from '@/services/firebase-services';
import { useAuth } from '@/contexts/AuthContext';
import Card, { CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import {
  UserGroupIcon,
  ClockIcon,
  MapPinIcon,
  CheckIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface MinyanCardProps {
  event: MinyanEvent;
  onRSVP?: (eventId: string, status: RSVPStatus) => void;
}

export default function MinyanCard({ event, onRSVP }: MinyanCardProps) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [userStatus, setUserStatus] = useState<RSVPStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAttendees, setShowAttendees] = useState(false);

  useEffect(() => {
    if (!event.id) return;

    // Subscribe to real-time attendance updates
    const unsubscribe = attendanceService.subscribeToAttendance(
      event.id,
      (newSummary) => {
        setSummary(newSummary);
        // Find current user's status
        if (user) {
          const userAttendance = newSummary.attendees.find(
            (a) => a.id === user.id
          );
          setUserStatus(userAttendance?.status || null);
        }
      }
    );

    return () => unsubscribe();
  }, [event.id, user]);

  const handleRSVP = async (status: RSVPStatus) => {
    if (!user || !event.id || isLoading) return;

    setIsLoading(true);
    try {
      await attendanceService.setAttendance(
        event.id,
        user.id,
        user.name,
        status
      );
      onRSVP?.(event.id, status);
    } catch (error) {
      console.error('Error setting attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasMinyan = (summary?.yesCount || 0) >= 10;
  const confirmCount = summary?.yesCount || 0;
  const maybeCount = summary?.maybeCount || 0;
  const percentage = Math.min((confirmCount / 10) * 100, 100);

  const getPrayerTypeStyles = (type: string) => {
    switch (type) {
      case 'Shacharis':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          light: 'bg-amber-50',
          text: 'text-amber-700',
          icon: '🌅',
        };
      case 'Mincha':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          light: 'bg-blue-50',
          text: 'text-blue-700',
          icon: '☀️',
        };
      case 'Maariv':
        return {
          bg: 'bg-gradient-to-r from-indigo-500 to-purple-500',
          light: 'bg-indigo-50',
          text: 'text-indigo-700',
          icon: '🌙',
        };
      default:
        return {
          bg: 'bg-gray-500',
          light: 'bg-gray-50',
          text: 'text-gray-700',
          icon: '📿',
        };
    }
  };

  const styles = getPrayerTypeStyles(event.prayerType);
  const yesAttendees = summary?.attendees.filter((a) => a.status === 'yes') || [];
  const maybeAttendees = summary?.attendees.filter((a) => a.status === 'maybe') || [];

  return (
    <Card 
      highlight={hasMinyan} 
      className={clsx(
        'relative overflow-hidden transition-all duration-300 hover:shadow-lg',
        hasMinyan && 'ring-2 ring-green-500/50'
      )}
    >
      {/* Minyan achieved banner with animation */}
      {hasMinyan && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-2 text-sm font-medium flex items-center justify-center gap-2 animate-pulse">
          <SparklesIcon className="h-4 w-4" />
          <span>Minyan Confirmed!</span>
          <SparklesIcon className="h-4 w-4" />
        </div>
      )}

      {/* Prayer type header strip */}
      <div className={clsx('h-1.5', styles.bg)} />

      <CardContent className={clsx('pt-4', hasMinyan && 'pt-12')}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{styles.icon}</span>
              <span
                className={clsx(
                  'px-3 py-1 rounded-full text-sm font-semibold',
                  styles.light,
                  styles.text
                )}
              >
                {event.prayerType}
              </span>
              <Badge variant="default" size="sm" className="font-medium">
                {event.nusach}
              </Badge>
            </div>
            
            <div className="space-y-1.5 mt-3">
              <div className="flex items-center text-gray-600">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                  <ClockIcon className="h-4 w-4 text-gray-500" />
                </div>
                <span className="font-medium">{event.time}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                  <MapPinIcon className="h-4 w-4 text-gray-500" />
                </div>
                <span className="text-sm">{event.location}</span>
              </div>
            </div>
          </div>

          {/* Circular Progress Counter */}
          <div className="relative">
            <svg className="w-20 h-20 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={hasMinyan ? '#dcfce7' : '#f3f4f6'}
                strokeWidth="6"
              />
              {/* Progress circle */}
              <circle
                cx="40"
                cy="40"
                r="34"
                fill="none"
                stroke={hasMinyan ? '#22c55e' : '#3b82f6'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - percentage / 100)}`}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={clsx(
                'text-2xl font-bold',
                hasMinyan ? 'text-green-600' : 'text-gray-800'
              )}>
                {confirmCount}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">/ 10</span>
            </div>
            {maybeCount > 0 && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  +{maybeCount} maybe
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Avatar stack of attendees */}
        {yesAttendees.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {yesAttendees.slice(0, 5).map((attendee, i) => (
                  <Avatar
                    key={attendee.id}
                    name={attendee.name}
                    size="sm"
                    className="ring-2 ring-white"
                  />
                ))}
                {yesAttendees.length > 5 && (
                  <div className="h-8 w-8 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center text-xs font-medium text-gray-600">
                    +{yesAttendees.length - 5}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAttendees(!showAttendees)}
                className="ml-3 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {showAttendees ? 'Hide' : 'View all'}
              </button>
            </div>
          </div>
        )}

        {/* RSVP Buttons */}
        {!event.isCancelled && (
          <div className="flex gap-2">
            <button
              onClick={() => handleRSVP('yes')}
              disabled={isLoading}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-medium text-sm transition-all duration-200',
                userStatus === 'yes'
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-[1.02]'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
              )}
            >
              <CheckIcon className="h-4 w-4" />
              Yes
            </button>
            <button
              onClick={() => handleRSVP('maybe')}
              disabled={isLoading}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-medium text-sm transition-all duration-200',
                userStatus === 'maybe'
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-[1.02]'
                  : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-amber-700'
              )}
            >
              <QuestionMarkCircleIcon className="h-4 w-4" />
              Maybe
            </button>
            <button
              onClick={() => handleRSVP('no')}
              disabled={isLoading}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-medium text-sm transition-all duration-200',
                userStatus === 'no'
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-[1.02]'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
              )}
            >
              <XMarkIcon className="h-4 w-4" />
              No
            </button>
          </div>
        )}

        {/* Cancelled overlay */}
        {event.isCancelled && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-2">
                <XMarkIcon className="h-6 w-6 text-red-500" />
              </div>
              <span className="text-red-600 font-semibold">Cancelled</span>
            </div>
          </div>
        )}

        {/* Expanded Attendee List */}
        {showAttendees && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
            {yesAttendees.length > 0 && (
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Confirmed ({yesAttendees.length})
                </h4>
                <div className="space-y-1.5">
                  {yesAttendees.map((attendee) => (
                    <div key={attendee.id} className="flex items-center gap-2">
                      <Avatar name={attendee.name} size="sm" />
                      <span className="text-sm text-gray-700">{attendee.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {maybeAttendees.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Maybe ({maybeAttendees.length})
                </h4>
                <div className="space-y-1.5">
                  {maybeAttendees.map((attendee) => (
                    <div key={attendee.id} className="flex items-center gap-2 opacity-60">
                      <Avatar name={attendee.name} size="sm" />
                      <span className="text-sm text-gray-600">{attendee.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}