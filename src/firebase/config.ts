import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Detect if Firebase config is placeholder or has invalid parameters
export const isPlaceholderMode = 
  !firebaseConfig || 
  firebaseConfig.apiKey === 'PLACEHOLDER_KEY' || 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey.trim() === '';

let appInstance: any = null;
let authInstance: any = null;
let dbInstance: any = null;

if (!isPlaceholderMode) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance, firebaseConfig.firestoreDatabaseId);
  } catch (error) {
    console.error('[TaskPilot AI] Firebase Initialization Failed, entering Simulation Mode:', error);
  }
} else {
  console.log('[TaskPilot AI] Firebase running in premium local simulation/placeholder mode.');
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;

// Connection test helper
export async function testConnection() {
  if (isPlaceholderMode || !db) {
    return;
  }
  
  try {
    const { doc, getDocFromServer } = await import('firebase/firestore');
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[TaskPilot AI] Firestore connection validated successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('[TaskPilot AI] Firestore Client is offline. Please check your Firebase configuration or project status.');
    } else {
      console.warn('[TaskPilot AI] Firestore connection check details:', error);
    }
  }
}

testConnection();

