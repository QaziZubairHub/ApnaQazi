import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export const getFriendlyAuthError = (code) => {
  const errors = {
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/wrong-password": "The password is incorrect.",
    "auth/user-not-found": "No account was found for this email.",
    "auth/email-already-in-use": "This email is already registered. Please sign in instead.",
    "auth/weak-password": "Your password should be at least 6 characters long.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/popup-closed-by-user": "The sign-in window was closed before completion.",
    "auth/popup-blocked": "The browser blocked the sign-in popup. Please allow popups and try again.",
    "auth/network-request-failed": "Please check your internet connection and try again.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
    "auth/user-disabled": "This account has been disabled.",
    "auth/account-exists-with-different-credential": "An account already exists with a different sign-in method.",
    "auth/cancelled-popup-request": "The sign-in popup was cancelled.",
    "auth/operation-not-allowed": "This sign-in method is not enabled. Please contact support.",
    "auth/requires-recent-login": "Please sign in again to continue.",
    "auth/credential-already-in-use": "This credential is already linked to another account.",
  };

  return errors[code] || "Something went wrong. Please try again.";
};

const getExistingUserRole = async (uid) => {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data()?.role || "user" : "user";
  } catch {
    return "user";
  }
};

export const saveUserProfile = async (user, provider) => {
  if (!user?.uid) return null;

  const profileRef = doc(db, "users", user.uid);
  const existingSnap = await getDoc(profileRef);
  const existingData = existingSnap.exists() ? existingSnap.data() : {};
  const role = await getExistingUserRole(user.uid);

  const profile = {
    uid: user.uid,
    fullname: user.displayName || existingData.fullname || "",
    email: user.email || existingData.email || "",
    photoURL: user.photoURL || existingData.photoURL || "",
    provider,
    role,
    loginTimestamp: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...(existingSnap.exists() ? {} : { createdAt: serverTimestamp() }),
  };

  await setDoc(profileRef, profile, { merge: true });
  return profile;
};

const signInWithPopupOrRedirect = async (provider, providerName) => {
  try {
    const result = await signInWithPopup(auth, provider);
    await saveUserProfile(result.user, providerName);
    return result.user;
  } catch (err) {
    // If popup is blocked or fails, fallback to redirect.
    // Note: Redirect will navigate away; remaining code won't run.
    console.error(`${providerName.toUpperCase()} POPUP ERROR:`, err);
    await signInWithRedirect(auth, provider);
    return null;
  }
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopupOrRedirect(provider, "google");
};

export const signInWithFacebook = async () => {
  const provider = new FacebookAuthProvider();
  provider.addScope("email");
  return signInWithPopupOrRedirect(provider, "facebook");
};

