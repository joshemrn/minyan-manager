'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout';
import { Button, Input, Card, CardContent, CardHeader, Spinner, Select } from '@/components/ui';
import { userService } from '@/services/firebase-services';
import { notificationService } from '@/services/notification-service';
import { PrayerType, Nusach } from '@/types';
import {
  BellIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';

interface ProfileForm {
  name: string;
  phone: string;
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

export default function SettingsPage() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [selectedPrayers, setSelectedPrayers] = useState<PrayerType[]>([]);
  const [preferredNusach, setPreferredNusach] = useState<Nusach>('Ashkenaz');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileForm>();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('phone', user.phone || '');
      setPushEnabled(user.notificationPreferences?.push ?? true);
      setWhatsappEnabled(user.whatsappOptIn ?? false);
      setEmailEnabled(user.notificationPreferences?.email ?? true);
      setSelectedPrayers(user.preferredPrayers || []);
      setPreferredNusach(user.preferredNusach || 'Ashkenaz');
    }
  }, [user, setValue]);

  const handleProfileUpdate = async (data: ProfileForm) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      await userService.updateUser(user.id, {
        name: data.name,
        phone: data.phone || undefined,
      });
      await refreshUser();
      toast.success('Profile updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotificationUpdate = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // Request push permission if enabling
      if (pushEnabled && !user.fcmToken) {
        await notificationService.initializeMessaging(user.id, (payload) => {
          console.log('Notification received:', payload);
        });
      }

      await userService.updateUser(user.id, {
        notificationPreferences: {
          push: pushEnabled,
          whatsapp: whatsappEnabled,
          email: emailEnabled,
          reminderMinutes: 10,
        },
        whatsappOptIn: whatsappEnabled,
      });
      await refreshUser();
      toast.success('Notification settings updated!');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      await userService.updateUser(user.id, {
        preferredPrayers: selectedPrayers,
        preferredNusach,
      });
      await refreshUser();
      toast.success('Preferences updated!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setIsUpdating(false);
    }
  };

  const togglePrayer = (prayer: PrayerType) => {
    setSelectedPrayers((prev) =>
      prev.includes(prayer)
        ? prev.filter((p) => p !== prayer)
        : [...prev, prayer]
    );
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
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Profile</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleProfileUpdate)} className="space-y-4">
              <Input
                label="Full Name"
                {...register('name', { required: 'Name is required' })}
                error={errors.name?.message}
              />
              <Input
                label="Phone Number (for WhatsApp)"
                type="tel"
                placeholder="+1 555-123-4567"
                helperText="Include country code for WhatsApp notifications"
                {...register('phone')}
              />
              <div className="flex justify-end">
                <Button type="submit" isLoading={isUpdating}>
                  Save Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BellIcon className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Push Notifications</p>
                    <p className="text-sm text-gray-500">
                      Receive alerts on your device
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPushEnabled(!pushEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    pushEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      pushEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* WhatsApp Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg
                    className="h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">WhatsApp Alerts</p>
                    <p className="text-sm text-gray-500">
                      Get minyan updates via WhatsApp
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    whatsappEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      whatsappEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">
                      Receive email reminders
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailEnabled(!emailEnabled)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    emailEnabled ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      emailEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleNotificationUpdate} isLoading={isUpdating}>
                  Save Notification Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prayer Preferences */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Prayer Preferences</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Preferred Prayers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Prayers
                </label>
                <div className="flex gap-2 flex-wrap">
                  {prayerOptions.map((prayer) => (
                    <button
                      key={prayer.value}
                      type="button"
                      onClick={() => togglePrayer(prayer.value as PrayerType)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedPrayers.includes(prayer.value as PrayerType)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {prayer.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Nusach */}
              <div>
                <Select
                  label="Preferred Nusach"
                  options={nusachOptions}
                  value={preferredNusach}
                  onChange={(e) => setPreferredNusach(e.target.value as Nusach)}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handlePreferencesUpdate} isLoading={isUpdating}>
                  Save Preferences
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
