import { createTRPCReact } from "@trpc/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";
import superjson from "superjson";
import { auth } from "./firebase";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/trpc` : "/api/trpc",
      transformer: superjson,
      async headers() {
        const user = auth.currentUser;
        if (user) {
          try {
            const token = await user.getIdToken();
            return {
              Authorization: `Bearer ${token}`,
            };
          } catch (error) {
            console.error("[TRPC] Failed to retrieve Firebase ID token:", error);
          }
        }
        return {};
      },
    }),
  ],
});

