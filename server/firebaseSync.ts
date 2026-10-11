import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDCc0MkJPgyNuM_ObFsb9DSGvtyuzt2g2c",
  authDomain: "rv-cyber-agent.firebaseapp.com",
  projectId: "rv-cyber-agent",
  storageBucket: "rv-cyber-agent.firebasestorage.app",
  messagingSenderId: "872140674398",
  appId: "1:872140674398:web:93eba3dcfa677f04816bcf",
  measurementId: "G-0YL7CY9ND3"
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const firestoreDb = getFirestore(app);
export const auth = getAuth(app);

// In Node.js backend environment, client SDK writes require an active authenticated user session.
// When unauthenticated, writing to Firestore triggers gRPC PERMISSION_DENIED errors.
function canSync(): boolean {
  return Boolean(auth.currentUser);
}

export async function syncArticleToFirestore(article: any) {
  if (!canSync()) return;
  try {
    await setDoc(doc(firestoreDb, 'articles', article.id), {
      ...article,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`[Firebase Sync] Synced article ${article.id} to Firestore`);
  } catch (err: any) {
    console.warn(`[Firebase Sync] Notice syncing article ${article.id}:`, err?.message || err);
  }
}

export async function syncVideoProjectToFirestore(project: any) {
  if (!canSync()) return;
  try {
    await setDoc(doc(firestoreDb, 'videos', project.id), {
      ...project,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`[Firebase Sync] Synced video ${project.id} to Firestore`);
  } catch (err: any) {
    console.warn(`[Firebase Sync] Notice syncing video ${project.id}:`, err?.message || err);
  }
}

export async function syncDocumentToFirestore(document: any) {
  if (!canSync()) return;
  try {
    await setDoc(doc(firestoreDb, 'documents', document.id), {
      ...document,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`[Firebase Sync] Synced document ${document.id} to Firestore`);
  } catch (err: any) {
    console.warn(`[Firebase Sync] Notice syncing document ${document.id}:`, err?.message || err);
  }
}

export async function syncUserToFirestore(user: any) {
  if (!canSync()) return;
  try {
    const { passwordHash, ...safeUser } = user;
    await setDoc(doc(firestoreDb, 'users', safeUser.id), {
      ...safeUser,
      syncedAt: new Date().toISOString(),
    }, { merge: true });
    console.log(`[Firebase Sync] Synced user ${safeUser.id} to Firestore`);
  } catch (err: any) {
    console.warn(`[Firebase Sync] Notice syncing user:`, err?.message || err);
  }
}
