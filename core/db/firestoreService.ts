import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { 
  FirestoreTask, 
  FirestoreGoal, 
  FirestoreUser, 
  FirestorePage, 
  FirestoreActionLog 
} from "./firestoreSchema";

/**
 * Generic Firestore service for Motion OS collections.
 */

// --- Users ---
export const syncUser = async (user: FirestoreUser) => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(userRef, user, { merge: true });
};

// --- Tasks ---
export const saveTask = async (task: FirestoreTask) => {
  if (task.id) {
    const taskRef = doc(db, "tasks", task.id);
    await setDoc(taskRef, task, { merge: true });
    return task.id;
  } else {
    const tasksCol = collection(db, "tasks");
    const docRef = await addDoc(tasksCol, task);
    return docRef.id;
  }
};

export const getUserTasks = async (userId: string) => {
  const tasksCol = collection(db, "tasks");
  const q = query(tasksCol, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreTask));
};

// --- Goals ---
export const saveGoal = async (goal: FirestoreGoal) => {
  if (goal.id) {
    const goalRef = doc(db, "goals", goal.id);
    await setDoc(goalRef, goal, { merge: true });
    return goal.id;
  } else {
    const goalsCol = collection(db, "goals");
    const docRef = await addDoc(goalsCol, goal);
    return docRef.id;
  }
};

export const getUserGoals = async (userId: string) => {
  const goalsCol = collection(db, "goals");
  const q = query(goalsCol, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreGoal));
};

// --- Pages ---
export const savePage = async (page: FirestorePage) => {
  const pageRef = doc(db, "workspace_pages", page.id);
  await setDoc(pageRef, page, { merge: true });
};

export const getUserPages = async (userId: string) => {
  const pagesCol = collection(db, "workspace_pages");
  const q = query(pagesCol, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FirestorePage);
};

// --- Action Logs ---
export const logAction = async (log: FirestoreActionLog) => {
  const logRef = doc(db, "action_logs", log.id);
  await setDoc(logRef, log, { merge: true });
};

export const getUserActionLogs = async (userId: string) => {
  const logsCol = collection(db, "action_logs");
  const q = query(logsCol, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FirestoreActionLog);
};
