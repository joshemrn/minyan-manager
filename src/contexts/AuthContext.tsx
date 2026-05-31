'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
  ActionCodeSettings,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, NotificationPreferences } from '@/types';

const MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLink: (email: string, href: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultNotificationPreferences: NotificationPreferences = {
  push: true,
  whatsapp: false,
  email: true,
  reminderMinutes: 10,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Mock helpers (only used when MOCK_AUTH=true) ---

  const buildMockUser = (email: string, name: string): User => ({
    id: 'mock-user',
    email,
    name,
    buildingIds: [],
    role: 'superadmin',
    notificationPreferences: defaultNotificationPreferences,
    whatsappOptIn: false,
    preferredPrayers: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockLogin = (email: string, name: string) => {
    const mockUser = buildMockUser(email, name);
    setUser(mockUser);
    window.localStorage.setItem('mockUser', JSON.stringify(mockUser));
  };

  // --- Firebase helpers (only used when MOCK_AUTH=false) ---

  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        ...data,
        id: userDoc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as User;
    }
    return null;
  };

  const createUserDocument = async (
    firebaseUser: FirebaseUser,
    name: string
  ): Promise<User> => {
    const newUser: Omit<User, 'id'> = {
      email: firebaseUser.email || '',
      name: name || firebaseUser.displayName || 'User',
      buildingIds: [],
      role: 'member',
      notificationPreferences: defaultNotificationPreferences,
      whatsappOptIn: false,
      preferredPrayers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...newUser,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { ...newUser, id: firebaseUser.uid };
  };

  // --- Auth state listener ---

  useEffect(() => {
    if (MOCK_AUTH) {
      const stored = localStorage.getItem('mockUser');
      if (stored) setUser(JSON.parse(stored));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      if (firebaseUser) {
        const userData = await fetchUserData(firebaseUser);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // --- Auth methods ---

  const signUp = async (email: string, _password: string, name: string) => {
    if (MOCK_AUTH) { mockLogin(email, name || email.split('@')[0]); return; }
    const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, _password);
    await updateProfile(firebaseUser, { displayName: name });
    const userData = await createUserDocument(firebaseUser, name);
    setUser(userData);
  };

  const sendMagicLink = async (email: string) => {
    if (MOCK_AUTH) { mockLogin(email, email.split('@')[0]); return; }
    const actionCodeSettings: ActionCodeSettings = {
      url: `${window.location.origin}/auth/email-link`,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  };

  const completeMagicLink = async (email: string, href: string) => {
    if (MOCK_AUTH) { mockLogin(email, email.split('@')[0]); return; }
    const { user: firebaseUser } = await signInWithEmailLink(auth, email, href);
    window.localStorage.removeItem('emailForSignIn');
    let userData = await fetchUserData(firebaseUser);
    if (!userData) {
      userData = await createUserDocument(
        firebaseUser,
        firebaseUser.displayName || email.split('@')[0]
      );
    }
    setUser(userData);
  };

  const resetPassword = async (email: string) => {
    if (MOCK_AUTH) return;
    await sendPasswordResetEmail(auth, email);
  };

  const signInWithGoogle = async () => {
    if (MOCK_AUTH) { mockLogin('test@example.com', 'Test User'); return; }
    const provider = new GoogleAuthProvider();
    const { user: firebaseUser } = await signInWithPopup(auth, provider);
    let userData = await fetchUserData(firebaseUser);
    if (!userData) {
      userData = await createUserDocument(firebaseUser, firebaseUser.displayName || 'User');
    }
    setUser(userData);
  };

  const logout = async () => {
    if (MOCK_AUTH) {
      localStorage.removeItem('mockUser');
      setUser(null);
      return;
    }
    await signOut(auth);
    setUser(null);
  };

  const refreshUser = async () => {
    if (MOCK_AUTH) return;
    if (firebaseUser) {
      const userData = await fetchUserData(firebaseUser);
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        loading,
        signUp,
        signInWithGoogle,
        sendMagicLink,
        completeMagicLink,
        resetPassword,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
