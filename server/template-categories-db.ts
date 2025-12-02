import { getDb } from "./db";
import { templateCategories, type TemplateCategory, type InsertTemplateCategory } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Create a new template category for a user
 */
export async function createCategory(data: InsertTemplateCategory): Promise<TemplateCategory> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(templateCategories).values(data);
  
  // Fetch the created category
  const [category] = await db
    .select()
    .from(templateCategories)
    .where(
      and(
        eq(templateCategories.userId, data.userId),
        eq(templateCategories.name, data.name)
      )
    )
    .orderBy(templateCategories.createdAt)
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
