// Prayer Types
export type PrayerType = 'Shacharis' | 'Mincha' | 'Maariv';

// Nusach Options
export type Nusach = 'Ashkenaz' | 'Sefard' | 'Eidot Mizrach';

// RSVP Status
export type RSVPStatus = 'yes' | 'maybe' | 'no';

// User Role
export type UserRole = 'member' | 'admin' | 'superadmin';

// Notification Preferences
export interface NotificationPreferences {
  push: boolean;
  whatsapp: boolean;
  email: boolean;
  reminderMinutes: number; // minutes before event
}

// User Model
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  buildingIds: string[];
  role: UserRole;
  notificationPreferences: NotificationPreferences;
  fcmToken?: string;
  whatsappOptIn: boolean;
  preferredPrayers: PrayerType[];
  preferredNusach?: Nusach;
  createdAt: Date;
  updatedAt: Date;
}

// Building Model
export interface Building {
  id: string;
  name: string;
  address: string;
  inviteCode: string;
  adminUserIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Recurrence Pattern
export interface RecurrencePattern {
  id: string;
  buildingId: string;
  prayerType: PrayerType;
  nusach: Nusach;
  time: string; // HH:mm format
  location: string;
  weekdays: number[]; // 0-6, where 0 is Sunday
  startDate: Date;
  endDate: Date;
  createdBy: string;
  createdAt: Date;
}

// Minyan Event Model
export interface MinyanEvent {
  id: string;
  buildingId: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:mm format
  prayerType: PrayerType;
  nusach: Nusach;
  location: string;
  recurrenceId?: string;
  isCancelled: boolean;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Model
export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  minyanEventId: string;
  status: RSVPStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Summary (for real-time display)
export interface AttendanceSummary {
  eventId: string;
  yesCount: number;
  maybeCount: number;
  noCount: number;
  hasMinyan: boolean;
  attendees: {
    id: string;
    name: string;
    status: RSVPStatus;
  }[];
}

// Announcement Model
export interface Announcement {
  id: string;
  buildingId: string;
  title: string;
  message: string;
  createdBy: string;
  createdAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form Types for Creating Events
export interface CreateMinyanEventForm {
  buildingId: string;
  date: string;
  time: string;
  prayerType: PrayerType;
  nusach: Nusach;
  location: string;
}

export interface CreateBulkMinyanForm {
  buildingId: string;
  prayerType: PrayerType;
  nusach: Nusach;
  time: string;
  location: string;
  weekdays: number[];
  startDate: string;
  endDate: string;
}

// Invite Link
export interface InviteLink {
  buildingId: string;
  code: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
}
