/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

const FirebaseContext = createContext(null);

const USERS_COLLECTION = "employee";
const TASKS_COLLECTION = "Tasks";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDiaRd6tXL-sbEUOkZHKcc7fbE_WylEvDY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "employee-94f1d.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "employee-94f1d",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "employee-94f1d.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "237423846118",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:237423846118:web:7be9797024e6b64689d127",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DK4GTRQYH1",
};

export const firebaseapp = initializeApp(firebaseConfig);
export const firestore = getFirestore(firebaseapp);
export const auth = getAuth(firebaseapp);

const normalizeEmail = (email = "") => email.trim().toLowerCase();

const normalizeRole = (role = "employee") => {
  const value = String(role).toLowerCase();
  return ["admin", "hr", "employee"].includes(value) ? value : "employee";
};

const toProfile = (firebaseUser, data = {}) => ({
  uid: firebaseUser.uid,
  name: data.fullName || data.name || firebaseUser.displayName || firebaseUser.email || "Team member",
  fullName: data.fullName || data.name || firebaseUser.displayName || firebaseUser.email || "Team member",
  email: normalizeEmail(data.email || firebaseUser.email || ""),
  role: normalizeRole(data.role),
  contact: data.contact || "",
});

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const shapeTask = (snapshotDoc) => {
  const data = snapshotDoc.data();
  const category = data.category || data.catagory || "General";
  const title = data.title || data.Task || "Untitled task";

  return {
    id: snapshotDoc.id,
    ...data,
    title,
    Task: title,
    category,
    catagory: category,
    assignedToName: data.assignedToName || data.assign || "Unassigned",
    assignedToEmail: normalizeEmail(data.assignedToEmail || ""),
    createdAtMillis: toMillis(data.createdAt),
    updatedAtMillis: toMillis(data.updatedAt),
  };
};

const sortTasks = (tasks) =>
  [...tasks].sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    return (b.createdAtMillis || 0) - (a.createdAtMillis || 0);
  });

export const formatFirebaseError = (error) => {
  const code = error?.code || "";

  const messages = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/weak-password": "Use a stronger password with at least 6 characters.",
    "permission-denied": "You do not have permission to perform this action.",
  };

  return messages[code] || error?.message || "Something went wrong. Please try again.";
};

export const getProfile = async (uid) => {
  const profileRef = doc(firestore, USERS_COLLECTION, uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    throw new Error("No profile was found for this account.");
  }

  return toProfile({ uid, email: profileSnap.data().email }, profileSnap.data());
};

export const ensureUserProfile = async (firebaseUser, defaults = {}) => {
  const profileRef = doc(firestore, USERS_COLLECTION, firebaseUser.uid);
  const profileSnap = await getDoc(profileRef);

  if (profileSnap.exists()) {
    return toProfile(firebaseUser, profileSnap.data());
  }

  const profile = {
    fullName: defaults.fullName || firebaseUser.displayName || firebaseUser.email || "Team member",
    email: normalizeEmail(defaults.email || firebaseUser.email || ""),
    role: normalizeRole(defaults.role),
    contact: defaults.contact || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(profileRef, profile, { merge: true });
  return toProfile(firebaseUser, profile);
};

const signup = async ({ email, password, fullName, role = "employee", contact = "" }) => {
  const userCredential = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);
  const user = userCredential.user;

  await setDoc(doc(firestore, USERS_COLLECTION, user.uid), {
    fullName: fullName.trim(),
    email: normalizeEmail(email),
    role: normalizeRole(role),
    contact: contact.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
};

export const signupWithGoogle = async (role = "employee") => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  await ensureUserProfile(result.user, { role });
  return result.user;
};

export const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
  return userCredential.user;
};

export const logout = () => signOut(auth);

export const sendResetPassword = (email) => sendPasswordResetEmail(auth, normalizeEmail(email));

export const getEmployees = async () => {
  const snapshot = await getDocs(collection(firestore, USERS_COLLECTION));

  return snapshot.docs
    .map((profileDoc) => {
      const data = profileDoc.data();
      return {
        uid: profileDoc.id,
        name: data.fullName || data.name || data.email || "Team member",
        email: normalizeEmail(data.email || ""),
        role: normalizeRole(data.role),
        contact: data.contact || "",
      };
    })
    .filter((profile) => profile.role === "employee")
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const createTask = async ({
  title,
  description,
  deadline,
  category,
  priority,
  assignedToUid,
  assignedToName,
  assignedToEmail,
  createdByName,
}) => {
  const currentUser = auth.currentUser;

  if (!currentUser) throw new Error("You must be signed in to create a task.");
  if (!title?.trim()) throw new Error("Task title is required.");
  if (!assignedToUid) throw new Error("Choose an employee before creating the task.");

  const cleanCategory = category?.trim() || "General";
  const cleanTitle = title.trim();

  await addDoc(collection(firestore, TASKS_COLLECTION), {
    title: cleanTitle,
    Task: cleanTitle,
    description: description?.trim() || "",
    deadline: deadline || "",
    category: cleanCategory,
    catagory: cleanCategory,
    priority: priority || "normal",
    assignedToUid,
    assignedToName: assignedToName || "Unassigned",
    assignedToEmail: normalizeEmail(assignedToEmail || ""),
    assign: assignedToName || "Unassigned",
    createdByUid: currentUser.uid,
    createdByEmail: normalizeEmail(currentUser.email || ""),
    createdByName: createdByName || currentUser.displayName || currentUser.email || "Manager",
    status: "new",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const SavedTask = async (Task, description, deadline, assign, catagory) =>
  createTask({
    title: Task,
    description,
    deadline,
    category: catagory,
    assignedToName: assign,
  });

export const subscribeAllTasks = (onNext, onError) =>
  onSnapshot(
    collection(firestore, TASKS_COLLECTION),
    (snapshot) => onNext(sortTasks(snapshot.docs.map(shapeTask))),
    onError
  );

export const subscribeEmployeeTasks = (user, onNext, onError) => {
  const tasksRef = collection(firestore, TASKS_COLLECTION);
  const buckets = new Map();
  const unsubscribers = [];

  const emit = () => {
    const merged = new Map();
    buckets.forEach((tasks) => {
      tasks.forEach((task) => merged.set(task.id, task));
    });
    onNext(sortTasks([...merged.values()]));
  };

  if (user?.uid) {
    unsubscribers.push(
      onSnapshot(
        query(tasksRef, where("assignedToUid", "==", user.uid)),
        (snapshot) => {
          buckets.set("uid", snapshot.docs.map(shapeTask));
          emit();
        },
        onError
      )
    );
  }

  if (user?.email) {
    unsubscribers.push(
      onSnapshot(
        query(tasksRef, where("assignedToEmail", "==", normalizeEmail(user.email))),
        (snapshot) => {
          buckets.set("email", snapshot.docs.map(shapeTask));
          emit();
        },
        onError
      )
    );
  }

  if (!unsubscribers.length) {
    onNext([]);
  }

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
};

export const deleteTask = async (taskId) => {
  await deleteDoc(doc(firestore, TASKS_COLLECTION, taskId));
};

export const updateTaskStatus = async (taskId, status) => {
  await updateDoc(doc(firestore, TASKS_COLLECTION, taskId), {
    status,
    completedAt: status === "completed" ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
};

export const markTaskCompleted = (taskId) => updateTaskStatus(taskId, "completed");

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }) => (
  <FirebaseContext.Provider
    value={{
      auth,
      createTask,
      deleteTask,
      formatFirebaseError,
      getEmployees,
      getProfile,
      login,
      logout,
      markTaskCompleted,
      SavedTask,
      sendResetPassword,
      signup,
      signupWithGoogle,
      subscribeAllTasks,
      subscribeEmployeeTasks,
      updateTaskStatus,
    }}
  >
    {children}
  </FirebaseContext.Provider>
);
