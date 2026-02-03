import { notifyOwner } from "./_core/notification";

interface DigestData {
  userName: string;
  userEmail: string;
  messagesThisWeek?: number;
  messagesLastWeek?: number;
  messagesThisMonth?: number;
  messagesLastMonth?: number;
  topSentinels: Array<{ name: string; count: number }>;
  longestConversation?: { title: string; messageCount: number };
  activeDays: number;
  streak: number;
  totalTokens?: number;
  estimatedSavings?: number;
  tier: "free" | "pro";
  monthlyLimit?: number;
}

export function generateWeeklyDigestHTML(data: DigestData): string {
  const percentChange = data.messagesLastWeek
    ? Math.round(
        ((data.messagesThisWeek! - data.messagesLastWeek) / data.messagesLastWeek) * 100
      )
    : 0;
  const changeIcon = percentChange >= 0 ? "📈" : "📉";
  const changeColor = percentChange >= 0 ? "#10b981" : "#ef4444";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly AI Digest</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">🚀 Your Weekly AI Digest</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Week of ${new Date().toLocaleDateString()}</p>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <p style="margin: 0; font-size: 18px; color: #e2e8f0;">Hi ${data.userName},</p>
              <p style="margin: 15px 0 0; font-size: 16px; color: #94a3b8; line-height: 1.6;">Here's how your AI conversations went this week:</p>
            </td>
          </tr>
          
          <!-- Stats Card -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #334155; border-radius: 12px; padding: 25px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 20px; font-size: 20px; color: #e2e8f0;">📊 This Week's Activity</h2>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 15px 0; border-bottom: 1px solid #475569;">
                          <span style="font-size: 14px; color: #94a3b8;">Messages Sent</span><br>
                          <span style="font-size: 32px; font-weight: 700; color: #3b82f6;">${data.messagesThisWeek}</span>
                          ${
                            data.messagesLastWeek
                              ? `<span style="font-size: 14px; color: ${changeColor}; margin-left: 10px;">${changeIcon} ${Math.abs(percentChange)}% vs last week</span>`
                              : ""
                          }
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 15px 0; border-bottom: 1px solid #475569;">
                          <span style="font-size: 14px; color: #94a3b8;">Active Days</span><br>
                          <span style="font-size: 28px; font-weight: 700; color: #10b981;">${data.activeDays}/7</span>
                        </td>
                      </tr>
                      ${
                        data.streak > 0
                          ? `
                      <tr>
                        <td style="padding: 15px 0;">
                          <span style="font-size: 14px; color: #94a3b8;">Current Streak</span><br>
                          <span style="font-size: 28px; font-weight: 700; color: #f59e0b;">🔥 ${data.streak} days</span>
                        </td>
                      </tr>
                      `
                          : ""
                      }
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Top Sentinels -->
          ${
            data.topSentinels.length > 0
              ? `
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #334155; border-radius: 12px; padding: 25px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 15px; font-size: 20px; color: #e2e8f0;">⭐ Top Sentinels</h2>
                    ${data.topSentinels
                      .slice(0, 3)
                      .map(
                        (s, i) => `
                    <div style="padding: 12px 0; ${i < 2 ? "border-bottom: 1px solid #475569;" : ""}">
                      <span style="font-size: 16px; color: #e2e8f0; font-weight: 600;">${i + 1}. ${s.name}</span>
                      <span style="float: right; font-size: 16px; color: #3b82f6; font-weight: 700;">${s.count} messages</span>
                    </div>
                    `
                      )
                      .join("")}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 20px 30px 40px; text-align: center;">
              <a href="${process.env.VITE_OAUTH_PORTAL_URL || "https://app.manus.im"}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">View Full Analytics →</a>
            </td>
          </tr>
          
          ${
            data.tier === "free" && data.monthlyLimit
              ? `
          <!-- Upgrade Prompt for Free Users -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); border-radius: 12px; padding: 20px; text-align: center;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 16px; color: white; font-weight: 600;">💎 Upgrade to Pro for unlimited messages</p>
                    <p style="margin: 10px 0 15px; font-size: 14px; color: rgba(255,255,255,0.9);">You've used ${data.messagesThisMonth}/${data.monthlyLimit} messages this month</p>
                    <a href="${process.env.VITE_OAUTH_PORTAL_URL || "https://app.manus.im"}/settings" style="display: inline-block; background-color: white; color: #ef4444; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 14px; font-weight: 600;">Upgrade Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                You're receiving this because you're subscribed to weekly digests.<br>
                <a href="${process.env.VITE_OAUTH_PORTAL_URL || "https://app.manus.im"}/settings" style="color: #3b82f6; text-decoration: none;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function generateMonthlyDigestHTML(data: DigestData): string {
  const percentChange = data.messagesLastMonth
    ? Math.round(
        ((data.messagesThisMonth! - data.messagesLastMonth) / data.messagesLastMonth) * 100
      )
    : 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Monthly AI Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">📈 Monthly AI Report</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
            </td>
          </tr>
          
          <!-- Summary -->
          <tr>
            <td style="padding: 40px 30px 30px;">
              <h2 style="margin: 0 0 20px; font-size: 24px; color: #e2e8f0; text-align: center;">🎉 Great month, ${data.userName}!</h2>
              <p style="margin: 0; font-size: 16px; color: #94a3b8; text-align: center; line-height: 1.6;">You had ${data.messagesThisMonth} conversations with your AI Sentinels this month${percentChange !== 0 ? `, ${percentChange > 0 ? "up" : "down"} ${Math.abs(percentChange)}% from last month` : ""}.</p>
            </td>
          </tr>
          
          <!-- Key Metrics Grid -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="48%" style="background-color: #334155; border-radius: 12px; padding: 20px; vertical-align: top;">
                    <div style="font-size: 14px; color: #94a3b8;">Total Messages</div>
                    <div style="font-size: 36px; font-weight: 700; color: #3b82f6; margin: 10px 0;">${data.messagesThisMonth}</div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background-color: #334155; border-radius: 12px; padding: 20px; vertical-align: top;">
                    <div style="font-size: 14px; color: #94a3b8;">Active Days</div>
                    <div style="font-size: 36px; font-weight: 700; color: #10b981; margin: 10px 0;">${data.activeDays}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          ${
            data.tier === "pro" && data.estimatedSavings
              ? `
          <!-- Pro Value Highlight -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 25px; text-align: center;">
                <tr>
                  <td>
                    <h3 style="margin: 0; color: white; font-size: 20px; font-weight: 700;">💰 Your Pro Savings</h3>
                    <p style="margin: 15px 0 0; font-size: 36px; color: white; font-weight: 700;">$${data.estimatedSavings.toFixed(2)}</p>
                    <p style="margin: 10px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">Estimated savings vs. direct API usage</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `
              : ""
          }
          
          <!-- Top Sentinels -->
          ${
            data.topSentinels.length > 0
              ? `
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 20px; font-size: 20px; color: #e2e8f0;">🏆 Your Top Sentinels</h3>
              ${data.topSentinels
                .map(
                  (s, i) => `
              <div style="background-color: #334155; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                <span style="font-size: 18px; color: #e2e8f0; font-weight: 600;">${i + 1}. ${s.name}</span>
                <span style="float: right; font-size: 18px; color: #3b82f6; font-weight: 700;">${s.count}</span>
              </div>
              `
                )
                .join("")}
            </td>
          </tr>
          `
              : ""
          }
          
          <!-- CTA -->
          <tr>
            <td style="padding: 20px 30px 40px; text-align: center;">
              <a href="${process.env.VITE_OAUTH_PORTAL_URL || "https://app.manus.im"}/analytics" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; text-decoration: none; padding: 18px 50px; border-radius: 10px; font-size: 18px; font-weight: 600;">View Detailed Analytics →</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                Monthly digest • Sovereign AI Assistant<br>
                <a href="${process.env.VITE_OAUTH_PORTAL_URL || "https://app.manus.im"}/settings" style="color: #3b82f6; text-decoration: none;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// Plain text versions for email clients that don't support HTML
export function generateWeeklyDigestText(data: DigestData): string {
  return `
Your Weekly AI Digest - Week of ${new Date().toLocaleDateString()}

Hi ${data.userName},

Here's how your AI conversations went this week:

ACTIVITY
- Messages sent: ${data.messagesThisWeek}${data.messagesLastWeek ? ` (${data.messagesThisWeek! > data.messagesLastWeek ? "+" : ""}${data.messagesThisWeek! - data.messagesLastWeek} vs last week)` : ""}
- Active days: ${data.activeDays}/7
${data.streak > 0 ? `- Current streak: ${data.streak} days` : ""}

TOP SENTINELS
${data.topSentinels.slice(0, 3).map((s, i) => `${i + 1}. ${s.name} - ${s.count} messages`).join("\n")}

View your full analytics: ${process.env.VITE_OAUTH_PORTAL_URL || "https://app.manus.im"}/analytics

---
Manage email preferences: ${process.env.VITE_OAUTH_PORTAL_URL || "https://app.manus.im"}/settings
  `.trim();
}

// Data aggregation functions
export async function aggregateWeeklyDigestData(userId: number): Promise<DigestData> {
  const { getDb } = await import("./db");
  const { messages, conversations, users, conversationSentinels, sentinels } = await import("../drizzle/schema");
  const { eq, and, gte, sql } = await import("drizzle-orm");
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get user
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error("User not found");
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  // Get user's conversations
  const userConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId));
  const conversationIds = userConversations.map(c => c.id);
  
  if (conversationIds.length === 0) {
    return {
      userName: user.name || "User",
      userEmail: user.email || "",
      messagesThisWeek: 0,
      messagesLastWeek: 0,
      topSentinels: [],
      activeDays: 0,
      streak: 0,
      tier: user.subscriptionTier as "free" | "pro",
    };
  }
  
  const { inArray } = await import("drizzle-orm");
  
  // Messages this week
  const [thisWeekResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, conversationIds),
        gte(messages.createdAt, weekAgo)
      )
    );
  const messagesThisWeek = Number(thisWeekResult?.count || 0);
  
  // Messages last week
  const [lastWeekResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, conversationIds),
        gte(messages.createdAt, twoWeeksAgo),
        sql`${messages.createdAt} < ${weekAgo}`
      )
    );
  const messagesLastWeek = Number(lastWeekResult?.count || 0);
  
  // Top Sentinels
  const sentinelStats = await db
    .select({
      sentinelId: messages.sentinelId,
      count: sql<number>`count(*)`
    })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, conversationIds),
        gte(messages.createdAt, weekAgo),
        sql`${messages.sentinelId} IS NOT NULL`
      )
    )
    .groupBy(messages.sentinelId)
    .orderBy(sql`count(*) DESC`)
    .limit(3);
  
  const topSentinels = await Promise.all(
    sentinelStats.map(async (stat) => {
      const [sentinel] = await db
        .select()
        .from(sentinels)
        .where(eq(sentinels.id, stat.sentinelId!));
      return {
        name: sentinel?.name || "Unknown",
        count: Number(stat.count)
      };
    })
  );
  
  // Active days (simplified - count distinct days with messages)
  const activeDaysResult = await db
    .select({
      day: sql<string>`DATE(${messages.createdAt})`
    })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, conversationIds),
        gte(messages.createdAt, weekAgo)
      )
    )
    .groupBy(sql`DATE(${messages.createdAt})`);
  const activeDays = activeDaysResult.length;
  
  // Streak calculation (simplified)
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const nextDate = new Date(checkDate.getTime() + 24 * 60 * 60 * 1000);
    
    const [dayMessages] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          inArray(messages.conversationId, conversationIds),
          gte(messages.createdAt, checkDate),
          sql`${messages.createdAt} < ${nextDate}`
        )
      );
    
    if (Number(dayMessages?.count || 0) > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return {
    userName: user.name || "User",
    userEmail: user.email || "",
    messagesThisWeek,
    messagesLastWeek,
    topSentinels,
    activeDays,
    streak,
    tier: user.subscriptionTier as "free" | "pro",
    monthlyLimit: user.subscriptionTier === "free" ? 50 : undefined,
    messagesThisMonth: messagesThisWeek, // Simplified for now
  };
}

export async function aggregateMonthlyDigestData(userId: number): Promise<DigestData> {
  const { getDb } = await import("./db");
  const { messages, conversations, users, sentinels } = await import("../drizzle/schema");
  const { eq, and, gte, sql } = await import("drizzle-orm");
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get user
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error("User not found");
  
  const now = new Date();
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
  
  // Get user's conversations
  const userConversations = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId));
  const conversationIds = userConversations.map(c => c.id);
  
  if (conversationIds.length === 0) {
    return {
      userName: user.name || "User",
      userEmail: user.email || "",
      messagesThisMonth: 0,
      messagesLastMonth: 0,
      topSentinels: [],
      activeDays: 0,
      streak: 0,
      tier: user.subscriptionTier as "free" | "pro",
    };
  }
  
  const { inArray } = await import("drizzle-orm");
  
  // Messages this month
  const [thisMonthResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, conversationIds),
        gte(messages.createdAt, monthAgo)
      )
    );
  const messagesThisMonth = Number(thisMonthResult?.count || 0);
  
  // Messages last month
  const [lastMonthResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, conversationIds),
        gte(messages.createdAt, twoMonthsAgo),
        sql`${messages.createdAt} < ${monthAgo}`
      )
    );
  const messagesLastMonth = Number(lastMonthResult?.count || 0);
  
  // Top Sentinels
  const sentinelStats = await db
    .select({
      sentinelId: messages.sentinelId,
      count: sql<number>`count(*)`
    })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, conversationIds),
        gte(messages.createdAt, monthAgo),
        sql`${messages.sentinelId} IS NOT NULL`
      )
    )
    .groupBy(messages.sentinelId)
    .orderBy(sql`count(*) DESC`);
  
  const topSentinels = await Promise.all(
    sentinelStats.map(async (stat) => {
      const [sentinel] = await db
        .select()
        .from(sentinels)
        .where(eq(sentinels.id, stat.sentinelId!));
      return {
        name: sentinel?.name || "Unknown",
        count: Number(stat.count)
      };
    })
  );
  
  // Active days
  const activeDaysResult = await db
    .select({
      day: sql<string>`DATE(${messages.createdAt})`
    })
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, conversationIds),
        gte(messages.createdAt, monthAgo)
      )
    )
    .groupBy(sql`DATE(${messages.createdAt})`);
  const activeDays = activeDaysResult.length;
  
  // Calculate estimated savings for Pro users
  let estimatedSavings = 0;
  if (user.subscriptionTier === "pro") {
    // Rough estimate: $0.002 per message (average GPT-4 cost)
    estimatedSavings = messagesThisMonth * 0.002 - 19; // Subtract Pro subscription cost
    estimatedSavings = Math.max(0, estimatedSavings);
  }
  
  return {
    userName: user.name || "User",
    userEmail: user.email || "",
    messagesThisMonth,
    messagesLastMonth,
    topSentinels,
    activeDays,
    streak: 0, // Not relevant for monthly
    tier: user.subscriptionTier as "free" | "pro",
    estimatedSavings: user.subscriptionTier === "pro" ? estimatedSavings : undefined,
    monthlyLimit: user.subscriptionTier === "free" ? 50 : undefined,
  };
}

// Send digest email
export async function sendDigestEmail(
  userId: number,
  type: "weekly" | "monthly"
): Promise<boolean> {
  try {
    const data = type === "weekly" 
      ? await aggregateWeeklyDigestData(userId)
      : await aggregateMonthlyDigestData(userId);
    
    const subject = type === "weekly"
      ? `Your Weekly AI Digest - ${new Date().toLocaleDateString()}`
      : `Your Monthly AI Report - ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
    
    const htmlContent = type === "weekly"
      ? generateWeeklyDigestHTML(data)
      : generateMonthlyDigestHTML(data);
    
    const textContent = type === "weekly"
      ? generateWeeklyDigestText(data)
      : generateMonthlyDigestText(data);
    
    // Use built-in notification API to send to owner (for now)
    // In production, you'd use a proper email service
    const success = await notifyOwner({
      title: subject,
      content: `Email digest for ${data.userName} (${data.userEmail}):\n\n${textContent}`
    });
    
    return success;
  } catch (error) {
    console.error(`[Email Digest] Failed to send ${type} digest:`, error);
    return false;
  }
}

export function generateMonthlyDigestText(data: DigestData): string {
  return `
Monthly AI Report - ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}

Great month, ${data.userName}!

You had ${data.messagesThisMonth} conversations with your AI Sentinels this month.

KEY METRICS
- Total messages: ${data.messagesThisMonth}
- Active days: ${data.activeDays}
${data.tier === "pro" && data.estimatedSavings ? `- Estimated savings: $${data.estimatedSavings.toFixed(2)}` : ""}

TOP SENTINELS
${data.topSentinels.map((s, i) => `${i + 1}. ${s.name} - ${s.count} messages`).join("\n")}

View detailed analytics: ${process.env.VITE_OAUTH_PORTAL_URL || "https://app.manus.im"}/analytics

---
Manage preferences: ${process.env.VITE_OAUTH_PORTAL_URL || "https://app.manus.im"}/settings
  `.trim();
}
