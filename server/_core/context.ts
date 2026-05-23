import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { firebaseAdmin } from "./firebaseAdmin";
import * as db from "../db";
import fs from "fs";
import path from "path";

const logFilePath = path.join(process.cwd(), "server.log");

function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFilePath, `[${timestamp}] ${message}\n`);
}

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
    logToFile(`[TRPC Context] Request: ${opts.req.method} ${opts.req.url}`);
    const authHeader = opts.req.headers.authorization;
    logToFile(`[TRPC Context] Authorization Header: ${authHeader ? authHeader.substring(0, 30) + "..." : "None"}`);
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      logToFile(`[TRPC Context] Token length: ${token.length}`);
      
      let decodedToken;
      try {
        decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        logToFile(`[TRPC Context] Token verified successfully. UID: ${decodedToken.uid}`);
      } catch (verifyErr) {
        logToFile(`[TRPC Context] verifyIdToken failed: ${verifyErr instanceof Error ? verifyErr.stack : String(verifyErr)}`);
        throw verifyErr;
      }
      
      const openId = decodedToken.uid;
      const signedInAt = new Date();
      
      let existingUser;
      try {
        existingUser = await db.getUserByOpenId(openId);
        logToFile(`[TRPC Context] getUserByOpenId result: ${existingUser ? `Found (ID: ${existingUser.id})` : "Not Found"}`);
      } catch (dbErr) {
        logToFile(`[TRPC Context] getUserByOpenId error: ${dbErr instanceof Error ? dbErr.stack : String(dbErr)}`);
        throw dbErr;
      }
      
      if (!existingUser) {
        logToFile(`[TRPC Context] Creating new user in DB...`);
        try {
          await db.upsertUser({
            openId: openId,
            name: decodedToken.name || "User",
            email: decodedToken.email ?? null,
            loginMethod: "google",
            lastSignedIn: signedInAt,
          });
          logToFile(`[TRPC Context] New user upserted.`);
        } catch (upsertErr) {
          logToFile(`[TRPC Context] New user upsert error: ${upsertErr instanceof Error ? upsertErr.stack : String(upsertErr)}`);
          throw upsertErr;
        }
      } else {
        logToFile(`[TRPC Context] Updating lastSignedIn and profile for existing user...`);
        try {
          await db.upsertUser({
            openId: openId,
            name: decodedToken.name || existingUser.name,
            email: decodedToken.email || existingUser.email,
            loginMethod: existingUser.loginMethod,
            role: existingUser.role,
            lastSignedIn: signedInAt,
          });
          logToFile(`[TRPC Context] Existing user updated.`);
        } catch (upsertErr) {
          logToFile(`[TRPC Context] Existing user upsert error: ${upsertErr instanceof Error ? upsertErr.stack : String(upsertErr)}`);
          throw upsertErr;
        }
      }

      try {
        user = await db.getUserByOpenId(openId);
        logToFile(`[TRPC Context] Refetched User ID: ${user?.id || "None"}`);
      } catch (refetchErr) {
        logToFile(`[TRPC Context] Refetch error: ${refetchErr instanceof Error ? refetchErr.stack : String(refetchErr)}`);
        throw refetchErr;
      }
    } else {
      logToFile("[TRPC Context] No valid Authorization Bearer token found.");
    }
  } catch (error) {
    logToFile(`[TRPC Context] Auth failed: ${error instanceof Error ? error.message : String(error)}`);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}


