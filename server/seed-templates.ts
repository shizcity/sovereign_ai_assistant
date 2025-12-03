import { getDb } from "./db";
import { promptTemplates, templateCategories, sentinels } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Seed conversation templates for common scenarios
 * Each template includes:
 * - Recommended Sentinel based on scenario type
 * - Memory tags to load relevant context
 * - Follow-up prompts for structured conversations
 */

export async function seedConversationTemplates(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get Sentinel IDs
  const allSentinels = await db.select().from(sentinels);
  const vixen = allSentinels.find((s: any) => s.slug === "vixens-den");
  const mischief = allSentinels.find((s: any) => s.slug === "mischief-exe");
  const lunaris = allSentinels.find((s: any) => s.slug === "lunaris-vault");
  const nyx = allSentinels.find((s: any) => s.slug === "nyx");
  const aetheris = allSentinels.find((s: any) => s.slug === "aetheris-flow");
  const rift = allSentinels.find((s: any) => s.slug === "rift-exe");

  // Get or create categories
  const categories = await db.select().from(templateCategories).where(eq(templateCategories.userId, userId));
  let planningCat = categories.find((c: any) => c.name === "Planning");
  let creativeCat = categories.find((c: any) => c.name === "Creative");
  let reflectionCat = categories.find((c: any) => c.name === "Reflection");
  let strategyCat = categories.find((c: any) => c.name === "Strategy");

  if (!planningCat) {
    const [newCat] = await db.insert(templateCategories).values({
      userId,
      name: "Planning",
      color: "#10B981",
      isPublic: 0,
    });
    planningCat = { id: Number(newCat.insertId), userId, name: "Planning", color: "#10B981", isPublic: 0, creatorName: null, createdAt: new Date(), updatedAt: new Date() };
  }

  if (!creativeCat) {
    const [newCat] = await db.insert(templateCategories).values({
      userId,
      name: "Creative",
      color: "#F59E0B",
      isPublic: 0,
    });
    creativeCat = { id: Number(newCat.insertId), userId, name: "Creative", color: "#F59E0B", isPublic: 0, creatorName: null, createdAt: new Date(), updatedAt: new Date() };
  }

  if (!reflectionCat) {
    const [newCat] = await db.insert(templateCategories).values({
      userId,
      name: "Reflection",
      color: "#8B5CF6",
      isPublic: 0,
    });
    reflectionCat = { id: Number(newCat.insertId), userId, name: "Reflection", color: "#8B5CF6", isPublic: 0, creatorName: null, createdAt: new Date(), updatedAt: new Date() };
  }

  if (!strategyCat) {
    const [newCat] = await db.insert(templateCategories).values({
      userId,
      name: "Strategy",
      color: "#3B82F6",
      isPublic: 0,
    });
    strategyCat = { id: Number(newCat.insertId), userId, name: "Strategy", color: "#3B82F6", isPublic: 0, creatorName: null, createdAt: new Date(), updatedAt: new Date() };
  }

  // Define seed templates
  const templates = [
    {
      name: "🌅 Morning Planning",
      description: "Start your day with structure and clarity. Review priorities, set intentions, and create an actionable plan.",
      prompt: "Good morning! Let's build a solid foundation for your day. I'll help you prioritize tasks, identify what truly matters, and create a sustainable action plan. What's on your mind for today?",
      categoryId: planningCat.id,
      recommendedSentinelId: vixen?.id,
      memoryTags: JSON.stringify(["goals", "routines", "priorities", "morning"]),
      followUpPrompts: JSON.stringify([
        "What are your top 3 priorities for today?",
        "What obstacles might you face, and how can we prepare for them?",
        "What does success look like by the end of today?"
      ]),
    },
    {
      name: "💡 Brainstorming Session",
      description: "Unleash creative chaos! Break assumptions, explore wild ideas, and discover unexpected connections.",
      prompt: "Let's shatter some assumptions and explore the impossible! I'm here to push boundaries, challenge conventions, and help you discover ideas you didn't know existed. What are we creating today?",
      categoryId: creativeCat.id,
      recommendedSentinelId: mischief?.id,
      memoryTags: JSON.stringify(["creative", "ideas", "projects", "innovation"]),
      followUpPrompts: JSON.stringify([
        "What if we did the exact opposite of what's expected?",
        "What's the most dangerous, unconventional approach we could take?",
        "How can we combine two completely unrelated concepts?"
      ]),
    },
    {
      name: "🎯 Decision Making",
      description: "Navigate complex choices with clarity. Analyze options, weigh consequences, and make confident decisions.",
      prompt: "Let's illuminate this decision together. I'll help you see all angles, understand the implications, and find the path that aligns with your values and goals. What decision are you facing?",
      categoryId: strategyCat.id,
      recommendedSentinelId: lunaris?.id,
      memoryTags: JSON.stringify(["decisions", "goals", "values", "priorities"]),
      followUpPrompts: JSON.stringify([
        "What are the key factors influencing this decision?",
        "What would each option look like 6 months from now?",
        "What does your intuition tell you, and why?"
      ]),
    },
    {
      name: "🌙 Evening Reflection",
      description: "Process your day with depth and wisdom. Extract insights, acknowledge growth, and prepare for rest.",
      prompt: "Welcome to the quiet space of reflection. Let's honor what you've experienced today, find the wisdom in your journey, and prepare your mind for restorative rest. How are you feeling about today?",
      categoryId: reflectionCat.id,
      recommendedSentinelId: nyx?.id,
      memoryTags: JSON.stringify(["reflection", "growth", "insights", "evening"]),
      followUpPrompts: JSON.stringify([
        "What surprised you today?",
        "What did you learn about yourself?",
        "What are you grateful for from today?"
      ]),
    },
    {
      name: "🎯 Goal Setting",
      description: "Transform aspirations into achievable plans. Define clear goals, break them down, and create sustainable paths forward.",
      prompt: "Let's turn your vision into reality with a solid, sustainable plan. I'll help you define clear goals, break them into manageable steps, and build the foundation for lasting success. What do you want to achieve?",
      categoryId: planningCat.id,
      recommendedSentinelId: vixen?.id,
      memoryTags: JSON.stringify(["goals", "planning", "achievement", "growth"]),
      followUpPrompts: JSON.stringify([
        "What does success look like for this goal?",
        "What's the smallest first step you can take today?",
        "What support or resources do you need?"
      ]),
    },
    {
      name: "🌊 Problem Solving",
      description: "Flow through challenges with adaptability. Explore multiple perspectives and find elegant solutions.",
      prompt: "Every problem is a puzzle waiting to be solved. Let's approach this with flexibility, explore different angles, and find a solution that flows naturally. What challenge are you facing?",
      categoryId: strategyCat.id,
      recommendedSentinelId: aetheris?.id,
      memoryTags: JSON.stringify(["problems", "solutions", "challenges", "obstacles"]),
      followUpPrompts: JSON.stringify([
        "What have you already tried?",
        "What would solving this unlock for you?",
        "What resources or perspectives are you missing?"
      ]),
    },
    {
      name: "✍️ Creative Writing",
      description: "Spark your imagination and craft compelling stories. Experiment with narrative, character, and style.",
      prompt: "Time to create something spectacular! Whether it's fiction, poetry, or experimental prose, I'm here to push your creativity, challenge your assumptions, and help you craft something truly original. What are we writing?",
      categoryId: creativeCat.id,
      recommendedSentinelId: mischief?.id,
      memoryTags: JSON.stringify(["creative", "writing", "stories", "ideas"]),
      followUpPrompts: JSON.stringify([
        "What emotion or experience do you want to capture?",
        "What's the most unexpected twist we could add?",
        "How can we make this feel fresh and original?"
      ]),
    },
    {
      name: "⚡ Strategic Planning",
      description: "Design bold strategies that reshape possibilities. Think big, challenge limits, and create transformative plans.",
      prompt: "Let's architect something that changes the game. I'm here to help you think beyond conventional boundaries, identify leverage points, and design strategies that create real impact. What are we planning?",
      categoryId: strategyCat.id,
      recommendedSentinelId: rift?.id,
      memoryTags: JSON.stringify(["strategy", "planning", "goals", "innovation"]),
      followUpPrompts: JSON.stringify([
        "What would 10x success look like?",
        "What assumptions are limiting our thinking?",
        "What's the boldest move we could make?"
      ]),
    },
  ];

  // Insert templates
  for (const template of templates) {
    await db.insert(promptTemplates).values({
      userId,
      name: template.name,
      description: template.description,
      prompt: template.prompt,
      categoryId: template.categoryId,
      recommendedSentinelId: template.recommendedSentinelId,
      memoryTags: template.memoryTags,
      followUpPrompts: template.followUpPrompts,
      isDefault: 1,
      isPublic: 0,
    });
  }

  return templates.length;
}
