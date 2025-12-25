# Minyan Manager 🕍

A full-stack web and mobile-friendly Progressive Web App (PWA) for organizing daily Jewish minyanim (prayer groups) in office buildings. Track attendance in real-time, send notifications, and ensure you always have 10 people for prayer.

## Features

### For Users
- **Authentication**: Sign up/login with email/password or Google OAuth
- **Join Buildings**: Join office buildings via invite code or link
- **RSVP System**: Respond Yes/Maybe/No to minyanim
- **Real-time Updates**: Live attendance counter with Firestore listeners
- **Visual Indicators**: Clear banner when minyan reaches 10 people
- **Prayer Preferences**: Set preferred prayer types and nusach

### For Admins
- **Create Minyanim**: Single events or bulk recurring schedules
- **Bulk Scheduling**: Create weeks/months of events with one click
- **Manage Events**: Edit, cancel, or delete individual or series events
- **Announcements**: Send messages to building members
- **User Management**: Building invite codes and member lists

### Notifications
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **WhatsApp Alerts**: Via Twilio WhatsApp API (opt-in)
- **Alert Types**:
  - Minyan confirmed (10+ people)
  - Group drops below 10
  - Event reminder (10 minutes before)

### Technical Features
- **PWA Support**: Installable on mobile/desktop
- **Offline Support**: Service worker caching
- **Real-time**: Firestore real-time listeners
- **Responsive**: Mobile-first, accessible design
- **Multiple Nusach**: Ashkenaz, Sefard, Eidot Mizrach

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Cloud Messaging)
- **WhatsApp**: Twilio WhatsApp API
- **State**: React Context + Zustand
- **Forms**: React Hook Form
- **PWA**: next-pwa

## Project Structure

```
minyan-manager/
├── public/
│   ├── icons/              # PWA icons
│   ├── manifest.json       # PWA manifest
│   └── firebase-messaging-sw.js  # FCM service worker
├── scripts/
│   └── seed.ts             # Database seeding script
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin panel
│   │   ├── buildings/      # Building management
│   │   ├── dashboard/      # Main dashboard
│   │   ├── join/           # Invite link handler
│   │   ├── login/          # Authentication
│   │   ├── minyanim/       # Minyanim browser
│   │   ├── settings/       # User settings
│   │   └── signup/         # Registration
│   ├── components/
│   │   ├── layout/         # Navigation, AppLayout
│   │   ├── minyan/         # MinyanCard, forms
│   │   └── ui/             # Button, Input, Card, etc.
│   ├── contexts/
│   │   └── AuthContext.tsx # Authentication context
│   ├── lib/
│   │   ├── firebase.ts     # Client-side Firebase
│   │   └── firebase-admin.ts # Server-side Firebase
│   ├── services/
│   │   ├── firebase-services.ts  # Firestore services
│   │   └── notification-service.ts
│   └── types/
│       └── index.ts        # TypeScript types
├── .env.example            # Environment variables template
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project (Firestore, Authentication, Cloud Messaging)
- Twilio account (optional, for WhatsApp)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd "minyen app"
   npm install
   ```

2. **Set up Firebase:**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - Enable Cloud Messaging
   - Get your config values

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your values:
   ```env
   # Firebase Client Config
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
   
   # Firebase Admin (from Service Account JSON)
   FIREBASE_ADMIN_PROJECT_ID=your_project_id
   FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   
   # Twilio WhatsApp (optional)
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

4. **Update Firebase Messaging Service Worker:**
   Edit `public/firebase-messaging-sw.js` with your Firebase config.

5. **Set up Firestore Security Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Buildings - members can read, admins can write
       match /buildings/{buildingId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && 
           request.auth.uid in resource.data.adminUserIds;
       }
       
       // Events - authenticated users can read, admins can write
       match /minyanEvents/{eventId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       
       // Attendance - authenticated users can read/write
       match /attendance/{attendanceId} {
         allow read, write: if request.auth != null;
       }
       
       // Announcements
       match /announcements/{announcementId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```

6. **Run the development server:**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

### Seeding Demo Data

After setting up Firebase credentials:

```bash
npm run seed
```

This creates:
- Demo building "Tech Tower NYC" with invite code `DEMO123`
- 10 demo users
- 14 days of minyan events
- Sample attendance data

**Demo Credentials:**
- Admin: `admin@example.com` / `password123`
- Member: `david@example.com` / `password123`

## API Keys Required

### Firebase (Required)
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Project Settings → General → Your apps → Web app
4. Copy the config values to `.env.local`
5. Project Settings → Service accounts → Generate new private key
6. Copy `client_email` and `private_key` to `.env.local`
7. Cloud Messaging → Web configuration → Generate key pair (VAPID key)

### Twilio WhatsApp (Optional)
1. Sign up at [Twilio](https://www.twilio.com)
2. Get Account SID and Auth Token from Console Dashboard
3. Set up WhatsApp Sandbox or register for WhatsApp Business API
4. Add credentials to `.env.local`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Build for production:
```bash
npm run build
npm start
```

## Data Models

### User
```typescript
{
  id: string;
  email: string;
  name: string;
  phone?: string;
  buildingIds: string[];
  role: 'member' | 'admin' | 'superadmin';
  notificationPreferences: {
    push: boolean;
    whatsapp: boolean;
    email: boolean;
    reminderMinutes: number;
  };
  preferredPrayers: PrayerType[];
  preferredNusach?: Nusach;
}
```

### Building
```typescript
{
  id: string;
  name: string;
  address: string;
  inviteCode: string;
  adminUserIds: string[];
}
```

### MinyanEvent
```typescript
{
  id: string;
  buildingId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  prayerType: 'Shacharis' | 'Mincha' | 'Maariv';
  nusach: 'Ashkenaz' | 'Sefard' | 'Eidot Mizrach';
  location: string;
  recurrenceId?: string;
  isCancelled: boolean;
}
```

### Attendance
```typescript
{
  id: string;
  userId: string;
  userName: string;
  minyanEventId: string;
  status: 'yes' | 'maybe' | 'no';
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this for your community!

---

Built with ❤️ to help Jewish communities organize prayer
