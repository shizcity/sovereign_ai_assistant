import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { promptTemplates, type InsertPromptTemplate, type PromptTemplate } from "../drizzle/schema";

export async function createTemplate(template: InsertPromptTemplate, creatorName?: string): Promise<PromptTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const templateData = {
    ...template,
    creatorName: creatorName || template.creatorName,
  };
  
  const [newTemplate] = await db.insert(promptTemplates).values(templateData).$returningId();
  const [created] = await db.select().from(promptTemplates).where(eq(promptTemplates.id, newTemplate.id));
  return created!;
}

export async function getTemplatesByUser(userId: number): Promise<PromptTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(promptTemplates).where(eq(promptTemplates.userId, userId));
}

export async function getTemplateById(id: number, userId: number): Promise<PromptTemplate | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const [template] = await db.select().from(promptTemplates)
    .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)));
  return template;
}

export async function updateTemplate(id: number, userId: number, updates: Partial<InsertPromptTemplate>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(promptTemplates)
    .set(updates)
    .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)));
}

export async function deleteTemplate(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(promptTemplates)
    .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)));
}

export async function createDefaultTemplates(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if default templates already exist for this user
  const existing = await db.select().from(promptTemplates)
    .where(and(eq(promptTemplates.userId, userId), eq(promptTemplates.isDefault, 1)));
  
  if (existing.length > 0) {
    // Default templates already exist, skip creation
    return;
  }
  
  const defaultTemplates: InsertPromptTemplate[] = [
    {
      userId,
      name: "Brainstorming Session",
      description: "Generate creative ideas and explore possibilities",
      prompt: "Let's have a brainstorming session about: [TOPIC]\n\nPlease help me:\n1. Generate 10 creative ideas\n2. Explore different angles and perspectives\n3. Consider both conventional and unconventional approaches\n4. Highlight the most promising ideas\n\nFocus on quantity and creativity over immediate feasibility.",
      categoryId: null, // Will be set when categories are created
      isDefault: 1,
    },
    {
      userId,
      name: "Content Writing",
      description: "Create engaging written content",
      prompt: "I need help writing content about: [TOPIC]\n\nPlease create:\n- A compelling headline\n- An engaging introduction\n- Well-structured body paragraphs\n- A strong conclusion with call-to-action\n\nTarget audience: [AUDIENCE]\nTone: [TONE - e.g., professional, casual, persuasive]\nLength: [LENGTH - e.g., 500 words, 1000 words]",
      categoryId: null, // Will be set when categories are created
      isDefault: 1,
    },
    {
      userId,
      name: "Code Review",
      description: "Review code for quality, bugs, and improvements",
      prompt: "Please review the following code:\n\n```\n[PASTE CODE HERE]\n```\n\nProvide feedback on:\n1. Code quality and readability\n2. Potential bugs or issues\n3. Performance optimizations\n4. Best practices and design patterns\n5. Security considerations\n6. Suggested improvements\n\nBe specific and provide examples where applicable.",
      categoryId: null, // Will be set when categories are created
      isDefault: 1,
    },
    {
      userId,
      name: "Problem Solving",
      description: "Analyze and solve complex problems systematically",
      prompt: "I'm facing the following problem: [PROBLEM]\n\nPlease help me:\n1. Break down the problem into smaller components\n2. Identify root causes\n3. Generate potential solutions\n4. Evaluate pros and cons of each solution\n5. Recommend the best approach\n6. Outline implementation steps\n\nUse a systematic, analytical approach.",
      categoryId: null, // Will be set when categories are created
      isDefault: 1,
    },
    {
      userId,
      name: "Learning Assistant",
      description: "Explain complex topics in simple terms",
      prompt: "I want to learn about: [TOPIC]\n\nPlease explain:\n1. The fundamental concepts in simple terms\n2. Key terminology and definitions\n3. Real-world examples and applications\n4. Common misconceptions\n5. Resources for further learning\n\nAssume I'm a beginner and use analogies where helpful.",
      categoryId: null, // Will be set when categories are created
      isDefault: 1,
    },
    {
      userId,
      name: "Business Strategy",
      description: "Develop strategic business plans and analysis",
      prompt: "Business context: [DESCRIBE YOUR BUSINESS/SITUATION]\n\nPlease help me develop:\n1. Market analysis and competitive landscape\n2. SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)\n3. Strategic objectives and goals\n4. Action plan with timelines\n5. Key performance indicators (KPIs)\n6. Risk mitigation strategies\n\nFocus on practical, actionable insights.",
      categoryId: null, // Will be set when categories are created
      isDefault: 1,
    },
  ];
  
  await db.insert(promptTemplates).values(defaultTemplates);
}

export async function getPublicTemplates(): Promise<PromptTemplate[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(promptTemplates)
    .where(eq(promptTemplates.isPublic, 1))
    .orderBy(promptTemplates.createdAt);
}

export async function toggleTemplatePublic(id: number, userId: number, isPublic: boolean): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(promptTemplates)
    .set({ isPublic: isPublic ? 1 : 0 })
    .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)));
}

export async function importTemplate(templateId: number, userId: number, userName: string): Promise<PromptTemplate> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the original template
  const [original] = await db.select().from(promptTemplates)
    .where(and(eq(promptTemplates.id, templateId), eq(promptTemplates.isPublic, 1)));
  
  if (!original) {
    throw new Error("Template not found or not public");
  }
  
  // Create a copy for the importing user
  const imported: InsertPromptTemplate = {
    userId,
    name: original.name,
    description: original.description,
    prompt: original.prompt,
    categoryId: original.categoryId,
    isDefault: 0,
    isPublic: 0, // Imported templates are private by default
    creatorName: original.creatorName, // Preserve original creator attribution
  };
  
  return createTemplate(imported);
}
