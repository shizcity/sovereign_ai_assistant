/**
 * Referral system DB helpers
 * Handles invite code generation, claim logic, and stats queries.
 */
import { and, eq, isNotNull, count, sum } from "drizzle-orm";
import { getDb } from "./db";
import { users, referrals } from "../drizzle/schema";
import { awardXp, XP_ACTIONS } from "./gamification";
import type { XpAction } from "./gamification";

// XP rewards
export const REFERRAL_XP_REFERRER = 250; // XP awarded to the person who invited
export const REFERRAL_XP_REFEREE = 100;  // Welcome bonus XP for the new user

/**
 * Generate a cryptographically random 8-character alphanumeric code.
 */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 to avoid confusion
  let code = "";
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  for (let i = 0; i < arr.length; i++) {
    code += chars[arr[i] % chars.length];
  }
  return code;
}

/**
 * Get or create a referral code for a user.
 * Idempotent — returns existing code if already set.
 */
export async function getOrCreateReferralCode(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if user already has a code
  const [user] = await db.select({ referralCode: users.referralCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.referralCode) return user.referralCode;

  // Generate a unique code (retry on collision)
  let code = "";
  let attempts = 0;
  while (attempts < 10) {
    code = generateCode();
    const [existing] = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.referralCode, code))
      .limit(1);
    if (!existing) break;
    attempts++;
  }

  await db.update(users)
    .set({ referralCode: code })
    .where(eq(users.id, userId));

  return code;
}

/**
 * Look up a user by their referral code.
 */
export async function getUserByReferralCode(code: string) {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db.select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.referralCode, code.toUpperCase()))
    .limit(1);

  return user ?? null;
}

/**
 * Claim a referral: award XP to both parties, record the referral row.
 * Safe to call multiple times — checks for duplicate claims.
 */
export async function claimReferral(referrerId: number, refereeId: number, code: string): Promise<{
  success: boolean;
  alreadyClaimed?: boolean;
  referrerXp: number;
  refereeXp: number;
}> {
  const db = await getDb();
  if (!db) return { success: false, referrerXp: 0, refereeXp: 0 };

  // Prevent self-referral
  if (referrerId === refereeId) {
    return { success: false, referrerXp: 0, refereeXp: 0 };
  }

  // Check if this referee has already been claimed
  const [existing] = await db.select({ id: referrals.id })
    .from(referrals)
    .where(and(eq(referrals.refereeId, refereeId), isNotNull(referrals.claimedAt)))
    .limit(1);

  if (existing) {
    return { success: false, alreadyClaimed: true, referrerXp: 0, refereeXp: 0 };
  }

  // Insert the referral record
  await db.insert(referrals).values({
    referrerId,
    refereeId,
    code,
    xpAwarded: REFERRAL_XP_REFERRER,
    claimedAt: new Date(),
  });

  // Award XP to referrer — insert directly since referral_sent is not in XP_ACTIONS
  const dbConn = await getDb();
  if (dbConn) {
    const { xpLedger } = await import("../drizzle/schema");
    await dbConn.insert(xpLedger).values({ userId: referrerId, action: "referral_sent", xpAwarded: REFERRAL_XP_REFERRER, metadata: null });
    await dbConn.insert(xpLedger).values({ userId: refereeId, action: "referral_received", xpAwarded: REFERRAL_XP_REFEREE, metadata: null });
  }

  return {
    success: true,
    referrerXp: REFERRAL_XP_REFERRER,
    refereeXp: REFERRAL_XP_REFEREE,
  };
}

/**
 * Get referral stats for a user (how many people they've invited, total XP earned).
 */
export async function getReferralStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalInvited: 0, totalXpEarned: 0, referees: [] };

  const [stats] = await db
    .select({
      totalInvited: count(referrals.id),
      totalXpEarned: sum(referrals.xpAwarded),
    })
    .from(referrals)
    .where(and(eq(referrals.referrerId, userId), isNotNull(referrals.claimedAt)));

  // Get recent referees with names
  const refereeRows = await db
    .select({
      refereeName: users.name,
      claimedAt: referrals.claimedAt,
      xpAwarded: referrals.xpAwarded,
    })
    .from(referrals)
    .innerJoin(users, eq(users.id, referrals.refereeId))
    .where(and(eq(referrals.referrerId, userId), isNotNull(referrals.claimedAt)))
    .orderBy(referrals.claimedAt)
    .limit(20);

  return {
    totalInvited: Number(stats?.totalInvited ?? 0),
    totalXpEarned: Number(stats?.totalXpEarned ?? 0),
    referees: refereeRows.map((r: { refereeName: string | null; claimedAt: Date | null; xpAwarded: number }) => ({
      name: r.refereeName ?? "Anonymous",
      claimedAt: r.claimedAt,
      xpAwarded: r.xpAwarded,
    })),
  };
}
