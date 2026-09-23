import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  remove,
  onValue,
  off,
} from "firebase/database";
import { firebaseConfig, isFirebaseConfigured } from "../firebaseConfig";
import { UserProfile, UserPlan } from "../types";

const LOCAL_STORAGE_USER_KEY = "aman_jantri_auth_user";
const LOCAL_STORAGE_TOKEN_KEY = "aman_jantri_session_token";

// Initialize Firebase App & Realtime Database if configured
const app = isFirebaseConfigured()
  ? getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp()
  : null;

export const rtdb = app ? getDatabase(app) : null;
// Export db as alias for backwards compatibility
export const db = rtdb;

// Generate unique session token
export function generateSessionToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "session_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
}

// Local mock storage for offline fallback
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
 * Initialize default Admin in Realtime Database if not already present
 */
export async function initializeDefaultAdmin(): Promise<void> {
  if (!rtdb) return;
  try {
    const adminRef = ref(rtdb, "users/admin");
    const adminSnap = await get(adminRef);
    if (!adminSnap.exists()) {
      await set(adminRef, {
        phoneNumber: "admin",
        password: "admin",
        role: "admin",
        currentSessionToken: "",
        lastLoginAt: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      console.log("Default admin account created in Realtime Database: admin / admin");
    }
  } catch (err) {
    console.warn("Could not check/create default admin in RTDB:", err);
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

  if (rtdb) {
    await initializeDefaultAdmin();
    const userRef = ref(rtdb, `users/${phone}`);
    const userSnap = await get(userRef);

    if (!userSnap.exists()) {
      throw new Error("Account not found. Contact administrator to create your account.");
    }

    const userData = userSnap.val() as UserProfile;

    if (!userData.isActive) {
      throw new Error("This account is currently deactivated. Please contact admin.");
    }

    if (userData.password !== password) {
      throw new Error("Incorrect password. Please try again.");
    }

    // Update RTDB with new session token (invalidates other active device sessions)
    const updatedFields = {
      currentSessionToken: sessionToken,
      lastLoginAt: new Date().toISOString(),
    };

    await update(userRef, updatedFields);

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
 * If currentSessionToken in RTDB changes (e.g. logged in on another device),
 * onForceLogout is triggered immediately!
 */
export function subscribeToUserSession(
  phoneNumber: string,
  onForceLogout: (reason: string) => void,
  onUserUpdate?: (user: UserProfile) => void
): () => void {
  if (rtdb) {
    const userRef = ref(rtdb, `users/${phoneNumber}`);
    const callback = (snapshot: any) => {
      if (!snapshot.exists()) {
        onForceLogout("Your account no longer exists.");
        return;
      }
      const data = snapshot.val() as UserProfile;
      const localToken = getStoredSessionToken();

      // Check if account was deactivated by admin
      if (!data.isActive) {
        onForceLogout("Your account has been deactivated by administrator.");
        return;
      }

      // Strict Single Device Rule:
      if (data.currentSessionToken && localToken && data.currentSessionToken !== localToken) {
        onForceLogout("You have been logged in on another device. Logging out from this device.");
        return;
      }

      // Real-time plan or profile update
      if (onUserUpdate) {
        onUserUpdate(data);
      }
    };

    onValue(userRef, callback);
    return () => off(userRef, "value", callback);
  } else {
    // For local mock testing
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

  if (rtdb) {
    const userRef = ref(rtdb, `users/${phoneNumber}`);
    const snap = await get(userRef);
    if (!snap.exists()) throw new Error("User does not exist.");

    const data = snap.val() as UserProfile;
    if (data.password !== oldPass) {
      throw new Error("Old password does not match.");
    }

    await update(userRef, { password: newPass.trim() });

    // Update local stored user
    const local = getStoredUser();
    if (local) {
      local.password = newPass.trim();
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(local));
    }
  } else {
    const mockUsers = getMockUsers();
    const user = mockUsers[phoneNumber];
    if (!user) throw new Error("User does not exist.");
    if (user.password !== oldPass) throw new Error("Old password does not match.");

    user.password = newPass.trim();
    saveMockUsers(mockUsers);

    const local = getStoredUser();
    if (local) {
      local.password = newPass.trim();
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(local));
    }
  }
}

/**
 * Admin: Get all users
 */
export async function adminGetAllUsers(): Promise<UserProfile[]> {
  if (rtdb) {
    await initializeDefaultAdmin();
    const usersRef = ref(rtdb, "users");
    const snap = await get(usersRef);
    if (!snap.exists()) return [];

    const obj = snap.val() as Record<string, UserProfile>;
    const list: UserProfile[] = Object.values(obj).filter(
      (u): u is UserProfile => Boolean(u && u.phoneNumber)
    );
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

  if (rtdb) {
    const userRef = ref(rtdb, `users/${phone}`);
    const existing = await get(userRef);
    if (existing.exists()) {
      throw new Error(`User "${phone}" already exists.`);
    }

    await set(userRef, newUser);
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

  if (rtdb) {
    const userRef = ref(rtdb, `users/${phoneNumber}`);
    const snap = await get(userRef);
    if (!snap.exists()) throw new Error("User does not exist.");

    const userData = snap.val() as UserProfile;
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

    await update(userRef, { plan: updatedPlan });
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

  if (rtdb) {
    const userRef = ref(rtdb, `users/${phoneNumber}`);
    await update(userRef, { plan: planUpdates });
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
  if (rtdb) {
    const userRef = ref(rtdb, `users/${phoneNumber}`);
    const updates: Partial<UserProfile> = { isActive };
    if (!isActive) {
      updates.currentSessionToken = "";
    }
    await update(userRef, updates);
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

  if (rtdb) {
    const userRef = ref(rtdb, `users/${phoneNumber}`);
    await update(userRef, { password: newPassword.trim() });
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

  if (rtdb) {
    const userRef = ref(rtdb, `users/${phoneNumber}`);
    await remove(userRef);
  } else {
    const mockUsers = getMockUsers();
    delete mockUsers[phoneNumber];
    saveMockUsers(mockUsers);
  }
}

const LAST_KNOWN_TIME_KEY = "aman_jantri_last_known_time";

export function getLastKnownTimestamp(): number {
  const val = localStorage.getItem(LAST_KNOWN_TIME_KEY);
  return val ? parseInt(val, 10) : 0;
}

export function setLastKnownTimestamp(timestamp: number): void {
  localStorage.setItem(LAST_KNOWN_TIME_KEY, String(timestamp));
}

/**
 * Fetch trusted network time from external UTC time API / Google CDN
 * Prevents hackers from rolling back phone date
 */
export async function fetchTrustedNetworkTime(): Promise<number> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://worldtimeapi.org/api/timezone/Etc/UTC", {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.unixtime) {
        const netTime = data.unixtime * 1000;
        setLastKnownTimestamp(netTime);
        return netTime;
      }
    }
  } catch {
    // network timeout or offline fallback
  }

  const now = Date.now();
  const lastKnown = getLastKnownTimestamp();
  if (now > lastKnown) {
    setLastKnownTimestamp(now);
  }
  return Math.max(now, lastKnown);
}

export interface PlanValidationResult {
  isValid: boolean;
  isExpired: boolean;
  isTampered: boolean;
  daysRemaining: number;
  errorMessage?: string;
}

/**
 * Anti-Tamper & Subscription Plan Expiry Validation
 */
export function validateUserSubscription(user: UserProfile | null): PlanValidationResult {
  if (!user) {
    return { isValid: false, isExpired: false, isTampered: false, daysRemaining: 0 };
  }

  // Admin bypass
  if (user.role === "admin") {
    return { isValid: true, isExpired: false, isTampered: false, daysRemaining: 9999 };
  }

  const phoneTime = Date.now();
  const lastKnown = getLastKnownTimestamp();

  // 1. Anti-Tamper Clock Rollback Detection:
  if (phoneTime < lastKnown - 1000 * 60 * 30) {
    return {
      isValid: false,
      isExpired: false,
      isTampered: true,
      daysRemaining: 0,
      errorMessage: "Device clock rollback detected! Please set date/time to automatic in phone settings.",
    };
  }

  if (phoneTime > lastKnown) {
    setLastKnownTimestamp(phoneTime);
  }

  // 2. Plan Expiry Check
  if (!user.plan || !user.plan.expiryDate) {
    return {
      isValid: false,
      isExpired: true,
      isTampered: false,
      daysRemaining: 0,
      errorMessage: "No active subscription plan found. Contact administrator.",
    };
  }

  const expiryTime = new Date(user.plan.expiryDate).getTime();
  const currentTime = Math.max(phoneTime, lastKnown);
  const diffMs = expiryTime - currentTime;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  if (diffMs <= 0) {
    return {
      isValid: false,
      isExpired: true,
      isTampered: false,
      daysRemaining: 0,
      errorMessage: `Your subscription plan has expired on ${new Date(user.plan.expiryDate).toLocaleDateString()}. Please contact admin to renew.`,
    };
  }

  return {
    isValid: true,
    isExpired: false,
    isTampered: false,
    daysRemaining,
  };
}
