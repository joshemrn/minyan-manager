'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { minyanEventService } from '@/services/firebase-services';
import { useAuth } from '@/contexts/AuthContext';
import { PrayerType, Nusach, CreateMinyanEventForm } from '@/types';
import { Button, Input, Select } from '@/components/ui';
import toast from 'react-hot-toast';

interface CreateMinyanFormProps {
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

export default function CreateMinyanForm({
  buildingId,
  onSuccess,
  onCancel,
}: CreateMinyanFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateMinyanEventForm>({
    defaultValues: {
      buildingId,
      prayerType: 'Mincha',
      nusach: 'Ashkenaz',
    },
  });

  const onSubmit = async (data: CreateMinyanEventForm) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await minyanEventService.createEvent({
        ...data,
        buildingId,
        isCancelled: false,
        createdBy: user.id,
      });
      toast.success('Minyan created successfully!');
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating minyan:', error);
      toast.error('Failed to create minyan');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        type="date"
        label="Date"
        {...register('date', { required: 'Date is required' })}
        error={errors.date?.message}
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

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting} className="flex-1">
          Create Minyan
        </Button>
      </div>
    </form>
  );
}
