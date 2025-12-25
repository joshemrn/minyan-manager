/**
 * Seed Script for Minyan Manager
 * 
 * This script creates demo data for testing the application.
 * Run with: npm run seed (after setting up Firebase credentials)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { addDays, format, getDay } from 'date-fns';

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

initializeApp({
  credential: cert(serviceAccount as any),
});

const db = getFirestore();
const auth = getAuth();

// Demo data
const DEMO_BUILDING = {
  name: 'Tech Tower NYC',
  address: '123 Madison Avenue, New York, NY 10016',
  inviteCode: 'DEMO123',
};

const DEMO_USERS = [
  { name: 'Admin User', email: 'admin@example.com', password: 'password123', role: 'admin' },
  { name: 'David Cohen', email: 'david@example.com', password: 'password123', role: 'member' },
  { name: 'Michael Levy', email: 'michael@example.com', password: 'password123', role: 'member' },
  { name: 'Jacob Goldberg', email: 'jacob@example.com', password: 'password123', role: 'member' },
  { name: 'Samuel Katz', email: 'samuel@example.com', password: 'password123', role: 'member' },
  { name: 'Benjamin Rosen', email: 'benjamin@example.com', password: 'password123', role: 'member' },
  { name: 'Daniel Shapiro', email: 'daniel@example.com', password: 'password123', role: 'member' },
  { name: 'Joshua Stern', email: 'joshua@example.com', password: 'password123', role: 'member' },
  { name: 'Aaron Weiss', email: 'aaron@example.com', password: 'password123', role: 'member' },
  { name: 'Nathan Klein', email: 'nathan@example.com', password: 'password123', role: 'member' },
];

const MINYAN_TEMPLATES = [
  { prayerType: 'Shacharis', time: '07:30', nusach: 'Ashkenaz', location: 'Conference Room A' },
  { prayerType: 'Mincha', time: '13:30', nusach: 'Ashkenaz', location: 'Conference Room B' },
  { prayerType: 'Mincha', time: '14:00', nusach: 'Sefard', location: 'Room 305' },
  { prayerType: 'Maariv', time: '18:00', nusach: 'Ashkenaz', location: 'Conference Room A' },
];

async function createUser(userData: typeof DEMO_USERS[0], buildingId: string) {
  try {
    // Check if user exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(userData.email);
      console.log(`User ${userData.email} already exists`);
    } catch {
      // Create new user
      userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
      });
      console.log(`Created user: ${userData.email}`);
    }

    // Create/update Firestore document
    await db.collection('users').doc(userRecord.uid).set({
      email: userData.email,
      name: userData.name,
      buildingIds: [buildingId],
      role: userData.role,
      notificationPreferences: {
        push: true,
        whatsapp: false,
        email: true,
        reminderMinutes: 10,
      },
      whatsappOptIn: false,
      preferredPrayers: ['Mincha'],
      preferredNusach: 'Ashkenaz',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });

    return userRecord.uid;
  } catch (error) {
    console.error(`Error creating user ${userData.email}:`, error);
    return null;
  }
}

async function createBuilding(adminUserId: string) {
  const buildingRef = db.collection('buildings').doc();
  
  await buildingRef.set({
    ...DEMO_BUILDING,
    adminUserIds: [adminUserId],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  console.log(`Created building: ${DEMO_BUILDING.name}`);
  return buildingRef.id;
}

async function createMinyanEvents(buildingId: string, adminUserId: string) {
  const today = new Date();
  const batch = db.batch();

  // Create events for the next 14 days
  for (let i = 0; i < 14; i++) {
    const date = addDays(today, i);
    const dayOfWeek = getDay(date);
    
    // Skip Saturday (Shabbat)
    if (dayOfWeek === 6) continue;

    for (const template of MINYAN_TEMPLATES) {
      // Skip Shacharis on Sunday
      if (dayOfWeek === 0 && template.prayerType === 'Shacharis') continue;

      const eventRef = db.collection('minyanEvents').doc();
      batch.set(eventRef, {
        buildingId,
        date: format(date, 'yyyy-MM-dd'),
        time: template.time,
        prayerType: template.prayerType,
        nusach: template.nusach,
        location: template.location,
        isCancelled: false,
        createdBy: adminUserId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  }

  await batch.commit();
  console.log('Created minyan events for the next 14 days');
}

async function createSampleAttendance(buildingId: string, userIds: string[]) {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Get today's events
  const eventsSnapshot = await db.collection('minyanEvents')
    .where('buildingId', '==', buildingId)
    .where('date', '==', today)
    .get();

  const batch = db.batch();

  for (const eventDoc of eventsSnapshot.docs) {
    // Add random attendance for each event (7-12 people)
    const numAttendees = Math.floor(Math.random() * 6) + 7;
    const shuffledUsers = [...userIds].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(numAttendees, shuffledUsers.length); i++) {
      const userId = shuffledUsers[i];
      const user = DEMO_USERS[i];
      
      const attendanceRef = db.collection('attendance').doc();
      batch.set(attendanceRef, {
        userId,
        userName: user?.name || 'User',
        minyanEventId: eventDoc.id,
        status: Math.random() > 0.2 ? 'yes' : 'maybe',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
  }

  await batch.commit();
  console.log('Created sample attendance records');
}

async function seed() {
  console.log('🌱 Starting seed script...\n');

  try {
    // Create admin user first to get their ID
    const adminUserId = await createUser(DEMO_USERS[0], '');
    if (!adminUserId) {
      throw new Error('Failed to create admin user');
    }

    // Create building
    const buildingId = await createBuilding(adminUserId);

    // Update admin user with building ID
    await db.collection('users').doc(adminUserId).update({
      buildingIds: [buildingId],
    });

    // Create remaining users
    const userIds = [adminUserId];
    for (let i = 1; i < DEMO_USERS.length; i++) {
      const userId = await createUser(DEMO_USERS[i], buildingId);
      if (userId) userIds.push(userId);
    }

    // Create minyan events
    await createMinyanEvents(buildingId, adminUserId);

    // Create sample attendance
    await createSampleAttendance(buildingId, userIds);

    // Create sample announcement
    await db.collection('announcements').add({
      buildingId,
      title: 'Welcome to Minyan Manager!',
      message: 'Thank you for joining our minyan community. Please make sure to RSVP for upcoming minyanim so we can ensure we have 10 people.',
      createdBy: adminUserId,
      createdAt: Timestamp.now(),
    });

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('   Admin: admin@example.com / password123');
    console.log('   Member: david@example.com / password123');
    console.log(`\n🔗 Invite Code: ${DEMO_BUILDING.inviteCode}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();
