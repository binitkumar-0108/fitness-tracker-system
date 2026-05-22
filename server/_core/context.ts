import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const cookies = (opts.req as any).cookies;
    const cookieHeader = opts.req.headers.cookie;
    console.log(`[TRPC Context] Request: ${opts.req.method} ${opts.req.url}`);
    console.log("[TRPC Context] Cookies (parser):", cookies);
    console.log("[TRPC Context] Cookie header:", cookieHeader);
    
    user = await sdk.authenticateRequest(opts.req);
    console.log("[TRPC Context] Authenticated User ID:", user?.id || "None");
  } catch (error) {
    console.warn("[TRPC Context] Auth failed:", error instanceof Error ? error.message : String(error));
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
