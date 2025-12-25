import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  addDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  User,
  Building,
  MinyanEvent,
  Attendance,
  RSVPStatus,
  RecurrencePattern,
  Announcement,
  AttendanceSummary,
} from '@/types';
import { addDays, format, parseISO, isAfter, isBefore, getDay } from 'date-fns';

// ==================== User Services ====================

export const userService = {
  async getUser(userId: string): Promise<User | null> {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as User;
    }
    return null;
  },

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async updateFcmToken(userId: string, token: string): Promise<void> {
    await this.updateUser(userId, { fcmToken: token });
  },

  async joinBuilding(userId: string, buildingId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user && !user.buildingIds.includes(buildingId)) {
      await this.updateUser(userId, {
        buildingIds: [...user.buildingIds, buildingId],
      });
    }
  },

  async leaveBuilding(userId: string, buildingId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      await this.updateUser(userId, {
        buildingIds: user.buildingIds.filter((id) => id !== buildingId),
      });
    }
  },
};

// ==================== Building Services ====================

export const buildingService = {
  async getBuilding(buildingId: string): Promise<Building | null> {
    const docRef = doc(db, 'buildings', buildingId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Building;
    }
    return null;
  },

  async getBuildingByInviteCode(code: string): Promise<Building | null> {
    const q = query(collection(db, 'buildings'), where('inviteCode', '==', code));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Building;
    }
    return null;
  },

  async createBuilding(data: Omit<Building, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'buildings'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateBuilding(buildingId: string, data: Partial<Building>): Promise<void> {
    const docRef = doc(db, 'buildings', buildingId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async getUserBuildings(buildingIds: string[]): Promise<Building[]> {
    if (buildingIds.length === 0) return [];
    
    const buildings: Building[] = [];
    for (const id of buildingIds) {
      const building = await this.getBuilding(id);
      if (building) buildings.push(building);
    }
    return buildings;
  },

  generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },
};

// ==================== Minyan Event Services ====================

export const minyanEventService = {
  async getEvent(eventId: string): Promise<MinyanEvent | null> {
    const docRef = doc(db, 'minyanEvents', eventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as MinyanEvent;
    }
    return null;
  },

  async getEventsForBuilding(buildingId: string, date?: string): Promise<MinyanEvent[]> {
    let q = query(
      collection(db, 'minyanEvents'),
      where('buildingId', '==', buildingId),
      orderBy('date', 'asc'),
      orderBy('time', 'asc')
    );

    if (date) {
      q = query(
        collection(db, 'minyanEvents'),
        where('buildingId', '==', buildingId),
        where('date', '==', date),
        orderBy('time', 'asc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as MinyanEvent;
    });
  },

  async createEvent(data: Omit<MinyanEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'minyanEvents'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async createBulkEvents(
    buildingId: string,
    pattern: Omit<RecurrencePattern, 'id' | 'createdAt'>,
    createdBy: string
  ): Promise<string[]> {
    // First create the recurrence pattern
    const patternRef = await addDoc(collection(db, 'recurrencePatterns'), {
      ...pattern,
      buildingId,
      createdBy,
      createdAt: serverTimestamp(),
    });

    const eventIds: string[] = [];
    const batch = writeBatch(db);
    
    let currentDate = parseISO(pattern.startDate.toString().split('T')[0]);
    const endDate = parseISO(pattern.endDate.toString().split('T')[0]);

    while (!isAfter(currentDate, endDate)) {
      const dayOfWeek = getDay(currentDate);
      
      if (pattern.weekdays.includes(dayOfWeek)) {
        const eventRef = doc(collection(db, 'minyanEvents'));
        batch.set(eventRef, {
          buildingId,
          date: format(currentDate, 'yyyy-MM-dd'),
          time: pattern.time,
          prayerType: pattern.prayerType,
          nusach: pattern.nusach,
          location: pattern.location,
          recurrenceId: patternRef.id,
          isCancelled: false,
          createdBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        eventIds.push(eventRef.id);
      }
      
      currentDate = addDays(currentDate, 1);
    }

    await batch.commit();
    return eventIds;
  },

  async updateEvent(eventId: string, data: Partial<MinyanEvent>): Promise<void> {
    const docRef = doc(db, 'minyanEvents', eventId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async cancelEvent(eventId: string): Promise<void> {
    await this.updateEvent(eventId, { isCancelled: true });
  },

  async deleteEvent(eventId: string): Promise<void> {
    await deleteDoc(doc(db, 'minyanEvents', eventId));
  },

  async deleteEventsByRecurrence(recurrenceId: string): Promise<void> {
    const q = query(
      collection(db, 'minyanEvents'),
      where('recurrenceId', '==', recurrenceId)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    
    // Also delete the recurrence pattern
    await deleteDoc(doc(db, 'recurrencePatterns', recurrenceId));
  },

  subscribeToEvents(
    buildingId: string,
    date: string,
    callback: (events: MinyanEvent[]) => void
  ) {
    const q = query(
      collection(db, 'minyanEvents'),
      where('buildingId', '==', buildingId),
      where('date', '==', date),
      orderBy('time', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as MinyanEvent;
      });
      callback(events);
    });
  },
};

// ==================== Attendance Services ====================

export const attendanceService = {
  async getAttendance(eventId: string, userId: string): Promise<Attendance | null> {
    const q = query(
      collection(db, 'attendance'),
      where('minyanEventId', '==', eventId),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Attendance;
    }
    return null;
  },

  async getEventAttendance(eventId: string): Promise<Attendance[]> {
    const q = query(
      collection(db, 'attendance'),
      where('minyanEventId', '==', eventId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Attendance;
    });
  },

  async setAttendance(
    eventId: string,
    userId: string,
    userName: string,
    status: RSVPStatus
  ): Promise<void> {
    const existing = await this.getAttendance(eventId, userId);
    
    if (existing) {
      await updateDoc(doc(db, 'attendance', existing.id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, 'attendance'), {
        userId,
        userName,
        minyanEventId: eventId,
        status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  },

  async getAttendanceSummary(eventId: string): Promise<AttendanceSummary> {
    const attendances = await this.getEventAttendance(eventId);
    
    const yesCount = attendances.filter((a) => a.status === 'yes').length;
    const maybeCount = attendances.filter((a) => a.status === 'maybe').length;
    const noCount = attendances.filter((a) => a.status === 'no').length;

    return {
      eventId,
      yesCount,
      maybeCount,
      noCount,
      hasMinyan: yesCount >= 10,
      attendees: attendances.map((a) => ({
        id: a.userId,
        name: a.userName,
        status: a.status,
      })),
    };
  },

  subscribeToAttendance(
    eventId: string,
    callback: (summary: AttendanceSummary) => void
  ) {
    const q = query(
      collection(db, 'attendance'),
      where('minyanEventId', '==', eventId)
    );

    return onSnapshot(q, async (snapshot) => {
      const attendances = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Attendance;
      });

      const yesCount = attendances.filter((a) => a.status === 'yes').length;
      const maybeCount = attendances.filter((a) => a.status === 'maybe').length;
      const noCount = attendances.filter((a) => a.status === 'no').length;

      callback({
        eventId,
        yesCount,
        maybeCount,
        noCount,
        hasMinyan: yesCount >= 10,
        attendees: attendances.map((a) => ({
          id: a.userId,
          name: a.userName,
          status: a.status,
        })),
      });
    });
  },
};

// ==================== Announcement Services ====================

export const announcementService = {
  async createAnnouncement(
    buildingId: string,
    title: string,
    message: string,
    createdBy: string
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'announcements'), {
      buildingId,
      title,
      message,
      createdBy,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async getAnnouncements(buildingId: string): Promise<Announcement[]> {
    const q = query(
      collection(db, 'announcements'),
      where('buildingId', '==', buildingId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Announcement;
    });
  },
};
