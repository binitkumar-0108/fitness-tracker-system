import dotenv from "dotenv";
dotenv.config();

console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);

let privateKey = process.env.FIREBASE_PRIVATE_KEY ?? "";
console.log("Raw Private Key Length:", privateKey.length);

if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
  privateKey = privateKey.slice(1, -1);
}
privateKey = privateKey.replace(/\\n/g, "\n");

console.log("Processed Private Key Length:", privateKey.length);
console.log("Processed Private Key contains newline:", privateKey.includes("\n"));
console.log("Processed Private Key Starts with BEGIN:", privateKey.startsWith("-----BEGIN PRIVATE KEY-----"));
console.log("Processed Private Key Ends with END:", privateKey.endsWith("-----END PRIVATE KEY-----"));

import admin from "firebase-admin";
try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
  console.log("Firebase Admin INITIALIZED SUCCESSFUL!");
} catch (error) {
  console.error("Firebase Admin INITIALIZATION FAILED:", error);
}
