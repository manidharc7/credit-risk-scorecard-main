import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db, SUPER_ADMIN_EMAIL } from "./config";

const usersRef = collection(db, "users");

async function isFieldTaken(field, value) {
  const q = query(usersRef, where(field, "==", value), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function fetchProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function signUp({
  role,
  name,
  email,
  phone,
  username,
  password,
  employeeId,
}) {
  // Firestore security rules only allow reading the `users` collection
  // once signed in, so the uniqueness checks run right after the auth
  // account is created (which signs the user in immediately) and the
  // account is rolled back if either handle is already taken.
  const credential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const uid = credential.user.uid;

  try {
    if (await isFieldTaken("username", username)) {
      throw new Error("Username is already taken");
    }

    if (role === "employee" && (await isFieldTaken("employeeId", employeeId))) {
      throw new Error("Employee ID is already registered");
    }
  } catch (err) {
    await credential.user.delete().catch(() => {});
    throw err;
  }

  const profile = {
    uid,
    name,
    email,
    phone,
    username,
    role,
    employeeId: role === "employee" ? employeeId : null,
    isAdmin: false,
    isSuperAdmin: email === SUPER_ADMIN_EMAIL,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, "users", uid), profile);
  } catch (err) {
    await credential.user.delete().catch(() => {});
    throw err;
  }

  return profile;
}

export async function logIn({ email, password, expectedRole }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);

  const profile = await fetchProfile(credential.user.uid);

  if (!profile) {
    await signOut(auth);
    throw new Error("No profile found for this account.");
  }

  if (expectedRole && profile.role !== expectedRole) {
    await signOut(auth);
    throw new Error(
      `This account is not registered as ${
        expectedRole === "employee" ? "an employee" : "a customer"
      }.`
    );
  }

  return profile;
}

// Firestore rules only allow a signed-in user to update their own
// `name` and `phone` fields — email, username, and role are fixed
// once the account is created.
export async function updateOwnProfile(uid, { name, phone }) {
  await updateDoc(doc(db, "users", uid), { name, phone });
}

export async function logOut() {
  await signOut(auth);
}

export async function resetPassword(email) {
  if (!email) {
    throw new Error("Enter your email above first, then try again.");
  }

  await sendPasswordResetEmail(auth, email);
}

// ============================================================
// GOOGLE + PHONE SIGN-IN
// ============================================================
//
// Both are "sign in or sign up" in one step: Firebase creates the
// auth account automatically if it doesn't exist yet. After either
// succeeds, the caller must check whether a Firestore `users/{uid}`
// profile already exists via `resolveProfileAfterOAuth` — if not,
// it's a first-time sign-in and the caller should collect the
// remaining profile fields (phone/username/employeeId) and call
// `createOAuthProfile`.
//
// ============================================================

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

export function createRecaptchaVerifier(containerId) {
  return new RecaptchaVerifier(auth, containerId, { size: "invisible" });
}

export async function startPhoneSignIn(phoneNumber, recaptchaVerifier) {
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

export async function confirmPhoneCode(confirmationResult, code) {
  const credential = await confirmationResult.confirm(code);
  return credential.user;
}

// Returns { profile } for an existing, role-matching account, or
// { needsProfile: true } for a brand-new sign-in. Signs the user
// back out and throws on a role mismatch, same as logIn().
export async function resolveProfileAfterOAuth(firebaseUser, expectedRole) {
  const profile = await fetchProfile(firebaseUser.uid);

  if (!profile) {
    return { needsProfile: true };
  }

  if (expectedRole && profile.role !== expectedRole) {
    await signOut(auth);
    throw new Error(
      `This account is not registered as ${
        expectedRole === "employee" ? "an employee" : "a customer"
      }.`
    );
  }

  return { profile };
}

export async function createOAuthProfile({
  uid,
  role,
  name,
  email,
  phone,
  username,
  employeeId,
}) {
  if (await isFieldTaken("username", username)) {
    throw new Error("Username is already taken");
  }

  if (role === "employee" && (await isFieldTaken("employeeId", employeeId))) {
    throw new Error("Employee ID is already registered");
  }

  const profile = {
    uid,
    name,
    email: email || null,
    phone,
    username,
    role,
    employeeId: role === "employee" ? employeeId : null,
    isAdmin: false,
    isSuperAdmin: email === SUPER_ADMIN_EMAIL,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", uid), profile);

  return profile;
}
