import cron from "node-cron";
import { getDb } from "./db";
import { users, userSettings } from "../drizzle/schema";
import { sendDigestEmail } from "./email-digest";

/**
 * Production Email Scheduling System
 * 
 * Cron schedule format: "second minute hour day month dayOfWeek"
 * - Weekly: Every Monday at 9:00 AM
 * - Monthly: 1st of each month at 9:00 AM
 */

let weeklyJob: any = null;
let monthlyJob: any = null;

/**
 * Start all scheduled jobs
 */
export function startScheduledJobs() {
  console.log("[Scheduler] Starting email digest jobs...");
  
  // Weekly digest - Every Monday at 9:00 AM
  weeklyJob = cron.schedule("0 9 * * 1", async () => {
    console.log("[Scheduler] Running weekly digest job...");
    await runWeeklyDigestJob();
  });
  
  // Monthly digest - 1st of each month at 9:00 AM
  monthlyJob = cron.schedule("0 9 1 * *", async () => {
    console.log("[Scheduler] Running monthly digest job...");
    await runMonthlyDigestJob();
  });
  
  console.log("[Scheduler] Email digest jobs started successfully");
  console.log("[Scheduler] Weekly: Every Monday at 9:00 AM PST");
  console.log("[Scheduler] Monthly: 1st of each month at 9:00 AM PST");
}

/**
 * Stop all scheduled jobs
 */
export function stopScheduledJobs() {
  console.log("[Scheduler] Stopping email digest jobs...");
  
  if (weeklyJob) {
    weeklyJob.stop();
    weeklyJob = null;
  }
  
  if (monthlyJob) {
    monthlyJob.stop();
    monthlyJob = null;
  }
  
  console.log("[Scheduler] Email digest jobs stopped");
}

/**
 * Weekly digest job - sends to users with 'weekly' or 'both' preference
 */
async function runWeeklyDigestJob() {
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Weekly Digest] Database not available");
      return;
    }
    
    // Get all users with their settings
    const allUsers = await db.select().from(users);
    const allSettings = await db.select().from(userSettings);
    
    // Join users with their settings
    const usersWithSettings = allUsers.map(user => ({
      ...user,
      settings: allSettings.find(s => s.userId === user.id)
    }));
    
    const eligibleUsers = usersWithSettings.filter((user: any) => {
      const frequency = user.settings?.emailDigestFrequency || "weekly";
      return frequency === "weekly" || frequency === "both";
    });
    
    console.log(`[Weekly Digest] Found ${eligibleUsers.length} eligible users`);
    
    // Send digest to each user
    for (const user of eligibleUsers) {
      try {
        const success = await sendDigestEmail(user.id, "weekly");
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`[Weekly Digest] Error sending to user ${user.id}:`, error);
        errorCount++;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Weekly Digest] Job completed in ${duration}ms`);
    console.log(`[Weekly Digest] Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error("[Weekly Digest] Job failed:", error);
  }
}

/**
 * Monthly digest job - sends to users with 'monthly' or 'both' preference
 */
async function runMonthlyDigestJob() {
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  
  try {
    const db = await getDb();
    if (!db) {
      console.error("[Monthly Digest] Database not available");
      return;
    }
    
    // Get all users with their settings
    const allUsers = await db.select().from(users);
    const allSettings = await db.select().from(userSettings);
    
    // Join users with their settings
    const usersWithSettings = allUsers.map(user => ({
      ...user,
      settings: allSettings.find(s => s.userId === user.id)
    }));
    
    const eligibleUsers = usersWithSettings.filter((user: any) => {
      const frequency = user.settings?.emailDigestFrequency || "weekly";
      return frequency === "monthly" || frequency === "both";
    });
    
    console.log(`[Monthly Digest] Found ${eligibleUsers.length} eligible users`);
    
    // Send digest to each user
    for (const user of eligibleUsers) {
      try {
        const success = await sendDigestEmail(user.id, "monthly");
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (error) {
        console.error(`[Monthly Digest] Error sending to user ${user.id}:`, error);
        errorCount++;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Monthly Digest] Job completed in ${duration}ms`);
    console.log(`[Monthly Digest] Success: ${successCount}, Errors: ${errorCount}`);
    
  } catch (error) {
    console.error("[Monthly Digest] Job failed:", error);
  }
}

/**
 * Manual trigger for testing - sends weekly digest to all eligible users immediately
 */
export async function triggerWeeklyDigestNow() {
  console.log("[Scheduler] Manually triggering weekly digest job...");
  await runWeeklyDigestJob();
}

/**
 * Manual trigger for testing - sends monthly digest to all eligible users immediately
 */
export async function triggerMonthlyDigestNow() {
  console.log("[Scheduler] Manually triggering monthly digest job...");
  await runMonthlyDigestJob();
}

/**
 * Initialize all scheduled jobs
 * Call this once on server startup
 */
export function initializeScheduler() {
  startScheduledJobs();
}
