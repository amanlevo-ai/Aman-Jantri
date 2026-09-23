import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured } from "../firebaseConfig";
import { UserProfile, UserPlan } from "../types";

const LOCAL_STORAGE_USER_KEY = "aman_jantri_auth_user";
const LOCAL_STORAGE_TOKEN_KEY = "aman_jantri_session_token";

// Initialize Firebase App & Firestore if configured
const app = isFirebaseConfigured()
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

const db = app ? getFirestore(app) : null;

// Generate unique session token
export function generateSessionToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
}

// Local mock storage for offline / before-Firebase configuration testing
const MOCK_STORAGE_KEY = "aman_jantri_mock_users_db";

function getMockUsers(): Record<string, UserProfile> {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  // Default admin and demo user with 1 year plan
  const now = new Date();
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const initial: Record<string, UserProfile> = {
    admin: {
      phoneNumber: "admin",
      password: "admin",
      role: "admin",
      currentSessionToken: "",
      lastLoginAt: now.toISOString(),
      isActive: true,
      createdAt: now.toISOString(),
    },
    "9876543210": {
      phoneNumber: "9876543210",
      password: "123",
      role: "user",
      currentSessionToken: "",
      lastLoginAt: now.toISOString(),
      isActive: true,
      createdAt: now.toISOString(),
      plan: {
        status: "active",
        startDate: now.toISOString(),
        expiryDate: oneYearLater.toISOString(),
        planName: "1 Year Plan",
      },
    },
  };
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveMockUsers(users: Record<string, UserProfile>) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Initialize default Admin in Firestore if not already present
 */
export async function initializeDefaultAdmin(): Promise<void> {
  if (!db) return;
  try {
    const adminRef = doc(db, "users", "admin");
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        phoneNumber: "admin",
        password: "admin",
        role: "admin",
        currentSessionToken: "",
        lastLoginAt: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      console.log("Default admin account created in Firestore: admin / admin");
    }
  } catch (err) {
    console.warn("Could not check/create default admin in Firestore:", err);
  }
}

/**
 * Get locally stored authenticated user
 */
export function getStoredUser(): UserProfile | null {
  const data = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Get locally stored session token
 */
export function getStoredSessionToken(): string | null {
  return localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
}

/**
 * Log in with Phone Number and Password
 */
export async function loginUser(
  phoneInput: string,
  passwordInput: string
): Promise<UserProfile> {
  const phone = phoneInput.trim();
  const password = passwordInput.trim();

  if (!phone || !password) {
    throw new Error("Please enter both phone number and password.");
  }

  const sessionToken = generateSessionToken();

  if (db) {
    await initializeDefaultAdmin();
    const userRef = doc(db, "users", phone);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("Account not found. Contact administrator to create your account.");
    }

    const userData = userSnap.data() as UserProfile;

    if (!userData.isActive) {
      throw new Error("This account is currently deactivated. Please contact admin.");
    }

    if (userData.password !== password) {
      throw new Error("Incorrect password. Please try again.");
    }

    // Update Firestore with new session token (this will invalidate any other active device session)
    const updatedFields = {
      currentSessionToken: sessionToken,
      lastLoginAt: new Date().toISOString(),
    };

    await updateDoc(userRef, updatedFields);

    const fullProfile: UserProfile = {
      ...userData,
      ...updatedFields,
    };

    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(fullProfile));
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, sessionToken);

    return fullProfile;
  } else {
    // Mock / Offline mode fallback
    const mockUsers = getMockUsers();
    const user = mockUsers[phone];

    if (!user) {
      throw new Error("Account not found. Contact administrator to create your account.");
    }

    if (!user.isActive) {
      throw new Error("This account is deactivated. Please contact admin.");
    }

    if (user.password !== password) {
      throw new Error("Incorrect password. Please try again.");
    }

    user.currentSessionToken = sessionToken;
    user.lastLoginAt = new Date().toISOString();
    saveMockUsers(mockUsers);

    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, sessionToken);

    return user;
  }
}

/**
 * Real-time Single Device Session Listener
 * If currentSessionToken on Firestore changes (e.g. logged in on another device),
 * onForceLogout is triggered immediately!
 */
export function subscribeToUserSession(
  phoneNumber: string,
  onForceLogout: (reason: string) => void,
  onUserUpdate?: (user: UserProfile) => void
): Unsubscribe {
  if (db) {
    const userRef = doc(db, "users", phoneNumber);
    return onSnapshot(
      userRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          onForceLogout("Your account no longer exists.");
          return;
        }
        const data = docSnap.data() as UserProfile;
        const localToken = getStoredSessionToken();

        // Check if account was deactivated by admin
        if (!data.isActive) {
          onForceLogout("Your account has been deactivated by administrator.");
          return;
        }

        // Strict Single Device Rule: If token in Firestore is different from our local token,
        // it means another device logged in!
        if (data.currentSessionToken && localToken && data.currentSessionToken !== localToken) {
          onForceLogout("You have been logged in on another device. Logging out from this device.");
          return;
        }

        // Real-time plan or profile update
        if (onUserUpdate) {
          onUserUpdate(data);
        }
      },
      (err) => {
        console.warn("Firestore session snapshot error:", err);
      }
    );
  } else {
    // For local mock testing, check periodically
    const interval = setInterval(() => {
      const mockUsers = getMockUsers();
      const user = mockUsers[phoneNumber];
      const localToken = getStoredSessionToken();
      if (user && localToken && user.currentSessionToken && user.currentSessionToken !== localToken) {
        onForceLogout("You have been logged in on another device. Logging out from this device.");
      } else if (user && onUserUpdate) {
        onUserUpdate(user);
      }
    }, 2000);

    return () => clearInterval(interval);
  }
}

/**
 * Log out user from current device
 */
export function logoutUser(): void {
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
}

/**
 * Change Password
 */
export async function changeUserPassword(
  phoneNumber: string,
  oldPass: string,
  newPass: string
): Promise<void> {
  if (!newPass || newPass.trim().length < 3) {
    throw new Error("New password must be at least 3 characters.");
  }

  if (db) {
    const userRef = doc(db, "users", phoneNumber);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error("User does not exist.");

    const data = snap.data() as UserProfile;
    if (data.password !== oldPass) {
      throw new Error("Old password does not match.");
    }

    await updateDoc(userRef, { password: newPass });

    // Update local stored user
    const local = getStoredUser();
    if (local) {
      local.password = newPass;
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(local));
    }
  } else {
    const mockUsers = getMockUsers();
    const user = mockUsers[phoneNumber];
    if (!user) throw new Error("User does not exist.");
    if (user.password !== oldPass) throw new Error("Old password does not match.");

    user.password = newPass;
    saveMockUsers(mockUsers);

    const local = getStoredUser();
    if (local) {
      local.password = newPass;
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(local));
    }
  }
}

/**
 * Admin: Get all users
 */
export async function adminGetAllUsers(): Promise<UserProfile[]> {
  if (db) {
    const usersCol = collection(db, "users");
    const snap = await getDocs(usersCol);
    const list: UserProfile[] = [];
    snap.forEach((docItem) => {
      list.push(docItem.data() as UserProfile);
    });
    // Sort with admin first, then recent
    return list.sort((a, b) => (a.role === "admin" ? -1 : 1));
  } else {
    const mockUsers = getMockUsers();
    return Object.values(mockUsers).sort((a, b) => (a.role === "admin" ? -1 : 1));
  }
}

/**
 * Admin: Create a new user with subscription plan
 */
export async function adminCreateUser(
  phoneNumber: string,
  password: string,
  role: "admin" | "user" = "user",
  planDays: number = 365
): Promise<UserProfile> {
  const phone = phoneNumber.trim();
  const pass = password.trim();

  if (!phone || !pass) {
    throw new Error("Username/Phone number and password are required.");
  }

  const now = new Date();
  const expiry = new Date(now.getTime() + planDays * 24 * 60 * 60 * 1000);

  const newUser: UserProfile = {
    phoneNumber: phone,
    password: pass,
    role,
    currentSessionToken: "",
    lastLoginAt: "",
    isActive: true,
    createdAt: now.toISOString(),
    plan:
      role === "admin"
        ? undefined
        : {
            status: "active",
            startDate: now.toISOString(),
            expiryDate: expiry.toISOString(),
            planName: planDays >= 365 ? `${Math.round(planDays / 365)} Year Plan` : `${planDays} Days Plan`,
          },
  };

  if (db) {
    const userRef = doc(db, "users", phone);
    const existing = await getDoc(userRef);
    if (existing.exists()) {
      throw new Error(`User "${phone}" already exists.`);
    }

    await setDoc(userRef, newUser);
    return newUser;
  } else {
    const mockUsers = getMockUsers();
    if (mockUsers[phone]) {
      throw new Error(`User "${phone}" already exists.`);
    }
    mockUsers[phone] = newUser;
    saveMockUsers(mockUsers);
    return newUser;
  }
}

/**
 * Admin: Extend user's plan by given number of days (default 365 = 1 year)
 */
export async function adminExtendUserPlan(
  phoneNumber: string,
  daysToAdd: number = 365
): Promise<UserPlan> {
  const now = new Date();

  if (db) {
    const userRef = doc(db, "users", phoneNumber);
    const snap = await getDoc(userRef);
    if (!snap.exists()) throw new Error("User does not exist.");

    const userData = snap.data() as UserProfile;
    let currentExpiry = userData.plan?.expiryDate ? new Date(userData.plan.expiryDate) : now;

    // If currently expired, start extending from today; else add to remaining expiry
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const updatedPlan: UserPlan = {
      status: "active",
      startDate: userData.plan?.startDate || now.toISOString(),
      expiryDate: newExpiry.toISOString(),
      planName: daysToAdd >= 365 ? `${Math.round(daysToAdd / 365)} Year Plan` : `${daysToAdd} Days Plan`,
    };

    await updateDoc(userRef, { plan: updatedPlan });
    return updatedPlan;
  } else {
    const mockUsers = getMockUsers();
    const user = mockUsers[phoneNumber];
    if (!user) throw new Error("User does not exist.");

    let currentExpiry = user.plan?.expiryDate ? new Date(user.plan.expiryDate) : now;
    const baseDate = currentExpiry > now ? currentExpiry : now;
    const newExpiry = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    const updatedPlan: UserPlan = {
      status: "active",
      startDate: user.plan?.startDate || now.toISOString(),
      expiryDate: newExpiry.toISOString(),
      planName: daysToAdd >= 365 ? `${Math.round(daysToAdd / 365)} Year Plan` : `${daysToAdd} Days Plan`,
    };

    user.plan = updatedPlan;
    saveMockUsers(mockUsers);
    return updatedPlan;
  }
}

/**
 * Admin: Set exact custom expiry date for user
 */
export async function adminSetUserExpiryDate(
  phoneNumber: string,
  expiryDateISO: string
): Promise<UserPlan> {
  const newExpiry = new Date(expiryDateISO);
  const now = new Date();
  const isExpired = now > newExpiry;

  const planUpdates: UserPlan = {
    status: isExpired ? "expired" : "active",
    startDate: now.toISOString(),
    expiryDate: newExpiry.toISOString(),
    planName: "Custom Plan",
  };

  if (db) {
    const userRef = doc(db, "users", phoneNumber);
    await updateDoc(userRef, { plan: planUpdates });
  } else {
    const mockUsers = getMockUsers();
    if (mockUsers[phoneNumber]) {
      mockUsers[phoneNumber].plan = planUpdates;
      saveMockUsers(mockUsers);
    }
  }

  return planUpdates;
}

/**
 * Admin: Toggle user active / inactive status
 */
export async function adminToggleUserStatus(
  phoneNumber: string,
  isActive: boolean
): Promise<void> {
  if (db) {
    const userRef = doc(db, "users", phoneNumber);
    // If deactivating, clear currentSessionToken so they are kicked out
    const updates: Partial<UserProfile> = { isActive };
    if (!isActive) {
      updates.currentSessionToken = "";
    }
    await updateDoc(userRef, updates);
  } else {
    const mockUsers = getMockUsers();
    if (mockUsers[phoneNumber]) {
      mockUsers[phoneNumber].isActive = isActive;
      if (!isActive) {
        mockUsers[phoneNumber].currentSessionToken = "";
      }
      saveMockUsers(mockUsers);
    }
  }
}

/**
 * Admin: Reset user password
 */
export async function adminResetUserPassword(
  phoneNumber: string,
  newPassword: string
): Promise<void> {
  if (!newPassword || newPassword.trim().length < 3) {
    throw new Error("Password must be at least 3 characters.");
  }

  if (db) {
    const userRef = doc(db, "users", phoneNumber);
    await updateDoc(userRef, { password: newPassword.trim() });
  } else {
    const mockUsers = getMockUsers();
    if (mockUsers[phoneNumber]) {
      mockUsers[phoneNumber].password = newPassword.trim();
      saveMockUsers(mockUsers);
    }
  }
}

/**
 * Admin: Delete user
 */
export async function adminDeleteUser(phoneNumber: string): Promise<void> {
  if (phoneNumber === "admin") {
    throw new Error("Cannot delete root admin account.");
  }

  if (db) {
    const userRef = doc(db, "users", phoneNumber);
    await deleteDoc(userRef);
  } else {
    const mockUsers = getMockUsers();
    delete mockUsers[phoneNumber];
    saveMockUsers(mockUsers);
  }
}
