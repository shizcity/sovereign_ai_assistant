import { getDb } from "./db";
import { templateCategories, type TemplateCategory, type InsertTemplateCategory } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Create a new template category for a user
 */
export async function createCategory(data: InsertTemplateCategory): Promise<TemplateCategory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(templateCategories).values(data);
  
  // Fetch the created category (get the most recent one)
  const [category] = await db
    .select()
    .from(templateCategories)
    .where(
      and(
        eq(templateCategories.userId, data.userId),
        eq(templateCategories.name, data.name)
      )
    )
    .orderBy(desc(templateCategories.createdAt))
    .limit(1);
  
  return category;
}

/**
 * Get all categories for a user
 */
export async function listCategories(userId: number): Promise<TemplateCategory[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(templateCategories)
    .where(eq(templateCategories.userId, userId))
    .orderBy(templateCategories.name);
}

/**
 * Get a specific category by ID
 */
export async function getCategoryById(id: number, userId: number): Promise<TemplateCategory | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [category] = await db
    .select()
    .from(templateCategories)
    .where(
      and(
        eq(templateCategories.id, id),
        eq(templateCategories.userId, userId)
      )
    )
    .limit(1);
  
  return category;
}

/**
 * Update a category
 */
export async function updateCategory(
  id: number,
  userId: number,
  data: Partial<InsertTemplateCategory>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(templateCategories)
    .set(data)
    .where(
      and(
        eq(templateCategories.id, id),
        eq(templateCategories.userId, userId)
      )
    );
}

/**
 * Delete a category
 */
export async function deleteCategory(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(templateCategories)
    .where(
      and(
        eq(templateCategories.id, id),
        eq(templateCategories.userId, userId)
      )
    );
}

/**
 * Create default categories for a new user
 */
export async function createDefaultCategories(userId: number): Promise<TemplateCategory[]> {
  const defaultCategories = [
    { userId, name: "Brainstorming", color: "#8b5cf6" }, // Purple
    { userId, name: "Writing", color: "#3b82f6" }, // Blue
    { userId, name: "Development", color: "#10b981" }, // Green
    { userId, name: "Analysis", color: "#f59e0b" }, // Amber
    { userId, name: "Education", color: "#ec4899" }, // Pink
    { userId, name: "Business", color: "#ef4444" }, // Red
  ];
  
  // Check if user already has categories
  const existing = await listCategories(userId);
  if (existing.length > 0) {
    return existing;
  }
  
  // Insert all default categories
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(templateCategories).values(defaultCategories);
  
  // Return the created categories
  return listCategories(userId);
}

/**
 * Toggle category public/private status
 */
export async function toggleCategoryPublic(
  id: number,
  userId: number,
  isPublic: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(templateCategories)
    .set({ isPublic: isPublic ? 1 : 0 })
    .where(
      and(
        eq(templateCategories.id, id),
        eq(templateCategories.userId, userId)
      )
    );
}

/**
 * Get all public categories (shared collections)
 */
export async function listPublicCategories(): Promise<TemplateCategory[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .select()
    .from(templateCategories)
    .where(eq(templateCategories.isPublic, 1))
    .orderBy(templateCategories.name);
}

/**
 * Import a public category (copy it with all its templates)
 * Returns the new category ID
 */
export async function importCategory(
  categoryId: number,
  targetUserId: number,
  targetUserName: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get the source category
  const [sourceCategory] = await db
    .select()
    .from(templateCategories)
    .where(
      and(
        eq(templateCategories.id, categoryId),
        eq(templateCategories.isPublic, 1)
      )
    )
    .limit(1);
  
  if (!sourceCategory) {
    throw new Error("Category not found or not public");
  }
  
  // Create a copy of the category for the target user
  await db.insert(templateCategories).values({
    userId: targetUserId,
    name: sourceCategory.name,
    color: sourceCategory.color,
    isPublic: 0, // Imported categories are private by default
    creatorName: targetUserName,
  });
  
  // Fetch the newly created category (get the most recent one)
  const [newCategory] = await db
    .select()
    .from(templateCategories)
    .where(
      and(
        eq(templateCategories.userId, targetUserId),
        eq(templateCategories.name, sourceCategory.name)
      )
    )
    .orderBy(desc(templateCategories.createdAt))
    .limit(1);
  
  const newCategoryId = newCategory.id;
  
  // Import all templates from this category
  const { promptTemplates } = await import("../drizzle/schema");
  const templates = await db
    .select()
    .from(promptTemplates)
    .where(eq(promptTemplates.categoryId, categoryId));
  
  if (templates.length > 0) {
    await db.insert(promptTemplates).values(
      templates.map((t) => ({
        userId: targetUserId,
        name: t.name,
        description: t.description,
        prompt: t.prompt,
        categoryId: newCategoryId,
        isDefault: 0,
        isPublic: 0, // Imported templates are private by default
        creatorName: targetUserName,
      }))
    );
  }
  
  return newCategoryId;
}
