import { auth } from "./firebase";
import { trpcClient } from "./trpc";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  try {
    await trpcClient.auth.login.mutate({
      openId: user.uid,
      name: user.displayName ?? "User",
      email: user.email,
      loginMethod: "google"
    });
  } catch (error) {
    console.error("[Auth] TRPC login failed:", error);
  }

  window.location.href = "/dashboard";
}

export async function logout() {
  await signOut(auth);
  window.location.href = "/";
}