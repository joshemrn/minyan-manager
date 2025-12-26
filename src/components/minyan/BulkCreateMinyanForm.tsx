'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { minyanEventService } from '@/services/firebase-services';
import { useAuth } from '@/contexts/AuthContext';
import { CreateBulkMinyanForm } from '@/types';
import { Button, Input, Select } from '@/components/ui';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface BulkCreateMinyanFormProps {
  buildingId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const prayerOptions = [
  { value: 'Shacharis', label: 'Shacharis (Morning)' },
  { value: 'Mincha', label: 'Mincha (Afternoon)' },
  { value: 'Maariv', label: "Maariv (Evening)" },
];

const nusachOptions = [
  { value: 'Ashkenaz', label: 'Ashkenaz' },
  { value: 'Sefard', label: 'Sefard' },
  { value: 'Eidot Mizrach', label: 'Eidot Mizrach' },
];

const weekdayLabels = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' },
];

export default function BulkCreateMinyanForm({
  buildingId,
  onSuccess,
  onCancel,
}: BulkCreateMinyanFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<Omit<CreateBulkMinyanForm, 'weekdays'>>({
    defaultValues: {
      buildingId,
      prayerType: 'Mincha',
      nusach: 'Ashkenaz',
    },
  });

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectAllWeekdays = () => {
    setSelectedWeekdays([1, 2, 3, 4, 5]); // Mon-Fri
  };

  const selectAllDays = () => {
    setSelectedWeekdays([0, 1, 2, 3, 4, 5, 6]);
  };

  const clearWeekdays = () => {
    setSelectedWeekdays([]);
  };

  const onSubmit = async (data: Omit<CreateBulkMinyanForm, 'weekdays'>) => {
    if (!user) return;

    if (selectedWeekdays.length === 0) {
      toast.error('Please select at least one day');
      return;
    }

    setIsSubmitting(true);
    try {
      const eventIds = await minyanEventService.createBulkEvents(
        buildingId,
        {
          ...data,
          buildingId,
          weekdays: selectedWeekdays,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          createdBy: user.id,
        },
        user.id
      );

      toast.success(`Created ${eventIds.length} minyan events!`);
      reset();
      setSelectedWeekdays([1, 2, 3, 4, 5]);
      onSuccess?.();
    } catch (error) {
      console.error('Error creating bulk minyanim:', error);
      toast.error('Failed to create minyanim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Prayer Type"
        options={prayerOptions}
        {...register('prayerType', { required: 'Prayer type is required' })}
        error={errors.prayerType?.message}
      />

      <Select
        label="Nusach"
        options={nusachOptions}
        {...register('nusach', { required: 'Nusach is required' })}
        error={errors.nusach?.message}
      />

      <Input
        type="time"
        label="Time"
        {...register('time', { required: 'Time is required' })}
        error={errors.time?.message}
      />

      <Input
        label="Location / Room"
        placeholder="e.g., Conference Room B, 3rd Floor"
        {...register('location', { required: 'Location is required' })}
        error={errors.location?.message}
      />

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="date"
          label="Start Date"
          {...register('startDate', { required: 'Start date is required' })}
          error={errors.startDate?.message}
        />
        <Input
          type="date"
          label="End Date"
          min={startDate}
          {...register('endDate', { required: 'End date is required' })}
          error={errors.endDate?.message}
        />
      </div>

      {/* Weekday Selection */}
      <div>
        <label className="block text-accessible-sm font-medium text-gray-700 mb-2">
          Repeat on Days
        </label>
        
        {/* Quick select buttons */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={selectAllWeekdays}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            Weekdays
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={selectAllDays}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            All Days
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={clearWeekdays}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            Clear
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {weekdayLabels.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleWeekday(day.value)}
              className={clsx(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                selectedWeekdays.includes(day.value)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
              title={day.fullLabel}
            >
              {day.label}
            </button>
          ))}
        </div>
        {selectedWeekdays.length === 0 && (
          <p className="text-sm text-red-600 mt-1">Select at least one day</p>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={selectedWeekdays.length === 0}
          className="flex-1"
        >
          Create Recurring Minyanim
        </Button>
      </div>
    </form>
  );
}
