import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { upsertUser, getUserByOpenId } from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("template reviews", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let templateId: number;
  let userId: number;

  beforeAll(async () => {
    // Create a test user
    const userData = {
      openId: "test-user-reviews",
      name: "Review Tester",
      email: "reviewer@test.com",
    };
    await upsertUser(userData);
    const user = await getUserByOpenId(userData.openId);
    if (!user) throw new Error("Test user not found");
    userId = user.id;

    // Create caller with user context
    caller = appRouter.createCaller(createTestContext(user));

    // Create a test template
    const template = await caller.templates.create({
      name: "Review Test Template",
      description: "A template for testing reviews",
      prompt: "Test prompt for [VARIABLE]",
      category: "Testing",
    });
    templateId = template.id;

    // Make it public so we can test reviews
    await caller.templates.togglePublic({
      id: templateId,
      isPublic: true,
    });
  });

  it("submits a review with rating and text", async () => {
    const review = await caller.templates.submitReview({
      templateId,
      rating: 5,
      reviewText: "Excellent template! Very helpful.",
    });

    expect(review).toBeDefined();
    expect(review.rating).toBe(5);
    expect(review.reviewText).toBe("Excellent template! Very helpful.");
    expect(review.templateId).toBe(templateId);
  });

  it("fetches reviews for a template", async () => {
    const reviews = await caller.templates.getReviews({ templateId });

    expect(reviews).toBeInstanceOf(Array);
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews[0].rating).toBe(5);
    expect(reviews[0].reviewText).toBe("Excellent template! Very helpful.");
  });

  it("fetches user's own review", async () => {
    const userReview = await caller.templates.getUserReview({ templateId });

    expect(userReview).toBeDefined();
    expect(userReview?.rating).toBe(5);
    expect(userReview?.reviewText).toBe("Excellent template! Very helpful.");
  });

  it("calculates average rating correctly", async () => {
    const rating = await caller.templates.getRating({ templateId });

    expect(rating).toBeDefined();
    expect(rating.averageRating).toBe(5);
    expect(rating.reviewCount).toBe(1);
  });

  it("updates existing review when submitting again", async () => {
    const updatedReview = await caller.templates.submitReview({
      templateId,
      rating: 4,
      reviewText: "Good template, but could be improved.",
    });

    expect(updatedReview).toBeDefined();
    expect(updatedReview.rating).toBe(4);
    expect(updatedReview.reviewText).toBe("Good template, but could be improved.");

    // Verify only one review exists
    const reviews = await caller.templates.getReviews({ templateId });
    expect(reviews.length).toBe(1);
  });

  it("fetches ratings for multiple templates", async () => {
    // Create another template
    const template2 = await caller.templates.create({
      name: "Second Review Test",
      description: "Another test template",
      prompt: "Test prompt 2",
      category: "Testing",
    });

    await caller.templates.togglePublic({
      id: template2.id,
      isPublic: true,
    });

    // Add a review to the second template
    await caller.templates.submitReview({
      templateId: template2.id,
      rating: 3,
      reviewText: "Average template.",
    });

    // Fetch ratings for both templates
    const ratings = await caller.templates.getRatings({
      templateIds: [templateId, template2.id],
    });

    expect(ratings).toBeInstanceOf(Array);
    expect(ratings.length).toBe(2);

    const rating1 = ratings.find((r) => r.templateId === templateId);
    const rating2 = ratings.find((r) => r.templateId === template2.id);

    expect(rating1?.averageRating).toBe(4); // Updated from previous test
    expect(rating1?.reviewCount).toBe(1);
    expect(rating2?.averageRating).toBe(3);
    expect(rating2?.reviewCount).toBe(1);
  });

  it("submits review without text (rating only)", async () => {
    // Create a third template
    const template3 = await caller.templates.create({
      name: "Rating Only Test",
      description: "Test rating without review text",
      prompt: "Test prompt 3",
      category: "Testing",
    });

    await caller.templates.togglePublic({
      id: template3.id,
      isPublic: true,
    });

    const review = await caller.templates.submitReview({
      templateId: template3.id,
      rating: 5,
    });

    expect(review).toBeDefined();
    expect(review.rating).toBe(5);
    expect(review.reviewText).toBeNull();
  });

  it("deletes a review", async () => {
    // Get the user's review
    const userReview = await caller.templates.getUserReview({ templateId });
    expect(userReview).toBeDefined();

    if (userReview) {
      // Delete the review
      const result = await caller.templates.deleteReview({
        reviewId: userReview.id,
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify review is deleted
      const deletedReview = await caller.templates.getUserReview({ templateId });
      expect(deletedReview).toBeUndefined();

      // Verify rating is updated
      const rating = await caller.templates.getRating({ templateId });
      expect(rating.reviewCount).toBe(0);
      expect(rating.averageRating).toBe(0);
    }
  });

  it("validates rating range (1-5)", async () => {
    await expect(
      caller.templates.submitReview({
        templateId,
        rating: 0, // Invalid: too low
      })
    ).rejects.toThrow();

    await expect(
      caller.templates.submitReview({
        templateId,
        rating: 6, // Invalid: too high
      })
    ).rejects.toThrow();
  });

  it("fetches featured templates (4+ stars, 3+ reviews)", async () => {
    // Create multiple templates and add reviews to test featured logic
    const template1 = await caller.templates.create({
      name: "High Rated Template 1",
      description: "Should be featured",
      prompt: "Test prompt 1",
      category: "Featured Test",
    });
    await caller.templates.togglePublic({ id: template1.id, isPublic: true });

    const template2 = await caller.templates.create({
      name: "High Rated Template 2",
      description: "Should also be featured",
      prompt: "Test prompt 2",
      category: "Featured Test",
    });
    await caller.templates.togglePublic({ id: template2.id, isPublic: true });

    const template3 = await caller.templates.create({
      name: "Low Rated Template",
      description: "Should NOT be featured",
      prompt: "Test prompt 3",
      category: "Featured Test",
    });
    await caller.templates.togglePublic({ id: template3.id, isPublic: true });

    // Add 5-star reviews to template1 (3 reviews)
    await caller.templates.submitReview({
      templateId: template1.id,
      rating: 5,
      reviewText: "Excellent!",
    });
    
    // Create another user to add more reviews
    const user2Data = {
      openId: "test-user-featured-2",
      name: "Reviewer 2",
      email: "reviewer2@test.com",
    };
    await upsertUser(user2Data);
    const user2 = await getUserByOpenId(user2Data.openId);
    if (!user2) throw new Error("User 2 not found");
    const caller2 = appRouter.createCaller(createTestContext(user2));

    await caller2.templates.submitReview({
      templateId: template1.id,
      rating: 5,
    });

    const user3Data = {
      openId: "test-user-featured-3",
      name: "Reviewer 3",
      email: "reviewer3@test.com",
    };
    await upsertUser(user3Data);
    const user3 = await getUserByOpenId(user3Data.openId);
    if (!user3) throw new Error("User 3 not found");
    const caller3 = appRouter.createCaller(createTestContext(user3));

    await caller3.templates.submitReview({
      templateId: template1.id,
      rating: 4,
    });

    // Add 4-star reviews to template2 (3 reviews)
    await caller.templates.submitReview({
      templateId: template2.id,
      rating: 4,
    });
    await caller2.templates.submitReview({
      templateId: template2.id,
      rating: 4,
    });
    await caller3.templates.submitReview({
      templateId: template2.id,
      rating: 5,
    });

    // Add only 2 reviews to template3 (below threshold)
    await caller.templates.submitReview({
      templateId: template3.id,
      rating: 5,
    });
    await caller2.templates.submitReview({
      templateId: template3.id,
      rating: 5,
    });

    // Fetch featured templates
    const featured = await caller.templates.getFeatured({ limit: 10 });

    // Verify results
    expect(featured).toBeInstanceOf(Array);
    
    // Template1 and Template2 should be featured (4+ stars, 3+ reviews)
    const featuredIds = featured.map(t => t.id);
    expect(featuredIds).toContain(template1.id);
    expect(featuredIds).toContain(template2.id);
    
    // Template3 should NOT be featured (only 2 reviews)
    expect(featuredIds).not.toContain(template3.id);

    // Verify rating data is included
    const template1Featured = featured.find(t => t.id === template1.id);
    expect(template1Featured?.averageRating).toBeGreaterThanOrEqual(4.0);
    expect(template1Featured?.reviewCount).toBeGreaterThanOrEqual(3);
  });
});
