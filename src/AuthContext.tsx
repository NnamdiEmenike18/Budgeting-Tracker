import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { auth } from './firebase';
import { UserProfile } from './types';
import { getUserProfile, createUserProfile, claimPendingInvitations } from './dbService';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  enterGuestSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileAndClaim = async (currentUser: User) => {
    try {
      let profile = await getUserProfile(currentUser.uid);
      if (!profile) {
        profile = await createUserProfile(
          currentUser.uid, 
          currentUser.email || '', 
          currentUser.displayName || ''
        );
      }
      
      setUserProfile(profile);

      // Self-heal and claim invitations that have been sent to our email asynchronously
      if (currentUser.email) {
        claimPendingInvitations(
          currentUser.email, 
          currentUser.uid, 
          profile.displayName
        ).catch(err => {
          console.warn('Background pending invitation claim failed:', err);
        });
      }
    } catch (err) {
      console.error('Error establishing user profile contexts:', err);
    }
  };

  useEffect(() => {
    // 1. Check if user already has an active guest/sandbox session saved
    if (localStorage.getItem('budget_ally_use_local') === 'true') {
      const guestMock: User = {
        uid: 'guest-sandbox-uid',
        email: 'guest@budgetally.local',
        displayName: 'Guest Officer',
        emailVerified: true,
        isAnonymous: true,
        providerId: 'local',
      } as any;
      setUser(guestMock);

      const cachedProfile = localStorage.getItem('budget_ally_guest_profile');
      if (cachedProfile) {
        try {
          setUserProfile(JSON.parse(cachedProfile));
        } catch (e) {
          setUserProfile({
            uid: 'guest-sandbox-uid',
            displayName: 'Guest Officer',
            email: 'guest@budgetally.local',
            avatarUrl: '',
            theme: 'indigo',
            bannerColor: '#4f46e5',
            bio: 'Zero-configuration offline safe workspace sandbox'
          });
        }
      } else {
        setUserProfile({
          uid: 'guest-sandbox-uid',
          displayName: 'Guest Officer',
          email: 'guest@budgetally.local',
          avatarUrl: '',
          theme: 'indigo',
          bannerColor: '#4f46e5',
          bio: 'Zero-configuration offline safe workspace sandbox'
        });
      }
      setLoading(false);
      return;
    }

    // 2. Otherwise use default standard Firebase OnAuthStateChanged
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Clear the boot loader screen instantly!
      
      if (currentUser) {
        // Fetch profile asynchronously in background
        fetchProfileAndClaim(currentUser).catch(err => {
          console.error('Background profile loader failed:', err);
        });
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      
      // Explicitly create user profile document
      await createUserProfile(cred.user.uid, email, name);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (localStorage.getItem('budget_ally_use_local') === 'true') {
        localStorage.removeItem('budget_ally_use_local');
        setUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const enterGuestSession = async () => {
    setLoading(true);
    try {
      localStorage.setItem('budget_ally_use_local', 'true');
      const guestMock: User = {
        uid: 'guest-sandbox-uid',
        email: 'guest@budgetally.local',
        displayName: 'Guest Officer',
        emailVerified: true,
        isAnonymous: true,
        providerId: 'local',
      } as any;

      setUser(guestMock);

      const defaultProfile: UserProfile = {
        uid: 'guest-sandbox-uid',
        displayName: 'Guest Officer',
        email: 'guest@budgetally.local',
        avatarUrl: '',
        theme: 'indigo',
        bannerColor: '#4f46e5',
        bio: 'Zero-configuration offline safe workspace sandbox'
      };

      const cachedProfile = localStorage.getItem('budget_ally_guest_profile');
      if (cachedProfile) {
        setUserProfile(JSON.parse(cachedProfile));
      } else {
        localStorage.setItem('budget_ally_guest_profile', JSON.stringify(defaultProfile));
        setUserProfile(defaultProfile);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await getUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signInWithGoogle,
      loginWithEmail,
      signUpWithEmail,
      logout,
      refreshProfile,
      enterGuestSession
    }}>
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
