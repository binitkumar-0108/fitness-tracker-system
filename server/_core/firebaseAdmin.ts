import admin from "firebase-admin";
import { ENV } from "./env";

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin;
  }

  try {
    if (ENV.firebaseProjectId && ENV.firebaseClientEmail && ENV.firebasePrivateKey) {
      let privateKey = ENV.firebasePrivateKey;
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }
      if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, "\n");

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: ENV.firebaseProjectId,
          clientEmail: ENV.firebaseClientEmail,
          privateKey,
        }),
      });
      console.log("[Firebase Admin] Initialized with explicit credentials");
    } else {
      admin.initializeApp();
      console.log("[Firebase Admin] Initialized with application default credentials");
    }
  } catch (error) {
    console.error("[Firebase Admin] Initialization failed:", error);
  }
  return admin;
}

export const firebaseAdmin = initializeFirebaseAdmin();
