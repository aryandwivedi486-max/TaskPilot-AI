import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, isPlaceholderMode } from '../firebase/config';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (isPlaceholderMode) {
      // Load any existing mock session from localStorage
      const savedUser = localStorage.getItem('taskpilot_mock_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setProfile({
            uid: parsed.uid,
            displayName: parsed.displayName,
            photoURL: parsed.photoURL,
            createdAt: parsed.createdAt,
            updatedAt: parsed.updatedAt,
          });
        } catch (e) {
          localStorage.removeItem('taskpilot_mock_user');
        }
      }
      setLoading(false);
      return;
    }

    // Real Firebase listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Map to profile type
        setProfile({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || 'TaskPilot Pilot',
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: firebaseUser.metadata.creationTime || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (isPlaceholderMode) {
      // Simulate instantly logging in Captain Julian
      const mockUser = {
        uid: 'mock-pilot-julian',
        displayName: 'Julian Sterling',
        photoURL: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('taskpilot_mock_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setProfile(mockUser);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      // Google Auth login using Popup mode (iframe resilient)
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('[TaskPilot AI] Google sign-in failed:', error);
      throw error;
    }
  };

  const logOut = async () => {
    if (isPlaceholderMode) {
      localStorage.removeItem('taskpilot_mock_user');
      setUser(null);
      setProfile(null);
      return;
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error('[TaskPilot AI] Log out failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

