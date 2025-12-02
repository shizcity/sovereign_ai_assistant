import { getDb } from "./db";
import { templateReviews, type InsertTemplateReview } from "../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * Create or update a review for a template
 * A user can only have one review per template
 */
export async function upsertReview(review: InsertTemplateReview) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if user already reviewed this template
  const existing = await db
    .select()
    .from(templateReviews)
    .where(
      and(
        eq(templateReviews.templateId, review.templateId),
        eq(templateReviews.userId, review.userId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing review
    await db
      .update(templateReviews)
      .set({
        rating: review.rating,
        reviewText: review.reviewText,
        updatedAt: new Date(),
      })
      .where(eq(templateReviews.id, existing[0].id));
    
    // Fetch and return updated review
    const [updated] = await db
      .select()
      .from(templateReviews)
      .where(eq(templateReviews.id, existing[0].id))
      .limit(1);
    return updated;
  } else {
    // Insert new review
    await db.insert(templateReviews).values(review);
    
    // Fetch and return inserted review
    const [inserted] = await db
      .select()
      .from(templateReviews)
      .where(
        and(
          eq(templateReviews.templateId, review.templateId),
          eq(templateReviews.userId, review.userId)
        )
      )
      .limit(1);
    return inserted;
  }
}

/**
 * Get all reviews for a specific template
 */
export async function getReviewsByTemplate(templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(templateReviews)
    .where(eq(templateReviews.templateId, templateId))
    .orderBy(desc(templateReviews.createdAt));
}

/**
 * Get a user's review for a specific template
 */
export async function getUserReview(templateId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db
    .select()
    .from(templateReviews)
    .where(
      and(
        eq(templateReviews.templateId, templateId),
        eq(templateReviews.userId, userId)
      )
    )
    .limit(1);
  return results[0];
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(templateReviews)
    .where(
      and(
        eq(templateReviews.id, reviewId),
        eq(templateReviews.userId, userId) // Only allow deleting own reviews
      )
    );
  return { success: true };
}

/**
 * Calculate average rating for a template
 */
export async function getTemplateRating(templateId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({
      averageRating: sql<number>`COALESCE(AVG(${templateReviews.rating}), 0)`,
      reviewCount: sql<number>`COUNT(*)`,
    })
    .from(templateReviews)
    .where(eq(templateReviews.templateId, templateId));

  return {
    averageRating: Number(result[0]?.averageRating || 0),
    reviewCount: Number(result[0]?.reviewCount || 0),
  };
}

/**
 * Get ratings for multiple templates (batch operation)
 */
export async function getTemplateRatings(templateIds: number[]) {
  if (templateIds.length === 0) return [];
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const results = await db
    .select({
      templateId: templateReviews.templateId,
      averageRating: sql<number>`AVG(${templateReviews.rating})`,
      reviewCount: sql<number>`COUNT(*)`,
    })
    .from(templateReviews)
    .where(sql`${templateReviews.templateId} IN (${sql.join(templateIds.map(id => sql`${id}`), sql`, `)})`)
    .groupBy(templateReviews.templateId);

  return results.map((r: any) => ({
    templateId: r.templateId,
    averageRating: Number(r.averageRating || 0),
    reviewCount: Number(r.reviewCount || 0),
  }));
}
