import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { logout } from "@/lib/auth";
import { trpc } from "@/lib/trpc";

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setFirebaseLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const { data: dbUser, isLoading: dbLoading, error: dbError } = trpc.auth.me.useQuery(undefined, {
    enabled: !!firebaseUser,
    retry: false,
  });

  const [syncAttempted, setSyncAttempted] = useState(false);
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      console.log("[useAuth] Sync successful, refetching session...");
      utils.auth.me.invalidate();
    },
    onError: (err) => {
      console.error("[useAuth] Sync failed:", err.message);
    }
  });

  useEffect(() => {
    if (firebaseUser && !firebaseLoading && !dbLoading && !dbUser && !syncAttempted) {
      console.log("[useAuth] Sync triggered for:", firebaseUser.uid);
      setSyncAttempted(true);
      loginMutation.mutate({
        openId: firebaseUser.uid,
        name: firebaseUser.displayName || "User",
        email: firebaseUser.email,
        loginMethod: "google"
      });
    }
  }, [firebaseUser, firebaseLoading, dbLoading, dbUser, syncAttempted]);

  const user = dbUser ? {
    ...dbUser,
    name: dbUser.name || firebaseUser?.displayName || "User"
  } : firebaseUser ? {
    ...firebaseUser,
    name: firebaseUser.displayName || "User"
  } : null;

  return {
    user,
    loading: firebaseLoading || (!!firebaseUser && dbLoading && !dbUser),
    isAuthenticated: !!firebaseUser,
    isSyncing: loginMutation.isPending,
    login: () => {
       if (firebaseUser) {
         console.log("[useAuth] Manual login triggered");
         loginMutation.mutate({
           openId: firebaseUser.uid,
           name: firebaseUser.displayName || "User",
           email: firebaseUser.email,
           loginMethod: "google"
         });
       }
    },
    logout
  };
}