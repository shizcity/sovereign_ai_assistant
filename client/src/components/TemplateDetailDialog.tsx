import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Star, User, Download, Trash2, Edit2 } from "lucide-react";

interface TemplateDetailDialogProps {
  template: {
    id: number;
    name: string;
    description: string | null;
    prompt: string;
    categoryId: number | null;
    creatorName: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport?: () => void;
}

export function TemplateDetailDialog({
  template,
  open,
  onOpenChange,
  onImport,
}: TemplateDetailDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const utils = trpc.useUtils();

  // Fetch reviews for this template
  const { data: reviews = [] } = trpc.templates.getReviews.useQuery(
    { templateId: template.id },
    { enabled: open }
  );

  // Fetch user's own review
  const { data: userReview } = trpc.templates.getUserReview.useQuery(
    { templateId: template.id },
    { enabled: open }
  );

  // Fetch rating stats
  const { data: ratingData } = trpc.templates.getRating.useQuery(
    { templateId: template.id },
    { enabled: open }
  );

  const submitReviewMutation = trpc.templates.submitReview.useMutation({
    onSuccess: () => {
      toast.success("Review submitted", {
        description: "Thank you for your feedback!",
      });
      setRating(0);
      setReviewText("");
      setIsEditing(false);
      utils.templates.getReviews.invalidate({ templateId: template.id });
      utils.templates.getUserReview.invalidate({ templateId: template.id });
      utils.templates.getRating.invalidate({ templateId: template.id });
      utils.templates.getRatings.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to submit review", {
        description: error.message,
      });
    },
  });

  const deleteReviewMutation = trpc.templates.deleteReview.useMutation({
    onSuccess: () => {
      toast.success("Review deleted");
      utils.templates.getReviews.invalidate({ templateId: template.id });
      utils.templates.getUserReview.invalidate({ templateId: template.id });
      utils.templates.getRating.invalidate({ templateId: template.id });
      utils.templates.getRatings.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to delete review", {
        description: error.message,
      });
    },
  });

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    submitReviewMutation.mutate({
      templateId: template.id,
      rating,
      reviewText: reviewText.trim() || undefined,
    });
  };

  const handleEditReview = () => {
    if (userReview) {
      setRating(userReview.rating);
      setReviewText(userReview.reviewText || "");
      setIsEditing(true);
    }
  };

  const handleDeleteReview = () => {
    if (userReview && confirm("Are you sure you want to delete your review?")) {
      deleteReviewMutation.mutate({ reviewId: userReview.id });
    }
  };

  const handleCancelEdit = () => {
    setRating(0);
    setReviewText("");
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl">{template.name}</DialogTitle>
              {template.description && (
                <DialogDescription className="mt-2">
                  {template.description}
                </DialogDescription>
              )}
            </div>
            {/* TODO: Add category badge based on categoryId */}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Creator and rating summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{template.creatorName || "Anonymous"}</span>
            </div>

            {ratingData && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.round(ratingData.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">
                  {ratingData.averageRating > 0
                    ? ratingData.averageRating.toFixed(1)
                    : "No ratings"}
                  {ratingData.reviewCount > 0 && ` (${ratingData.reviewCount} reviews)`}
                </span>
              </div>
            )}
          </div>

          {/* Template prompt */}
          <div>
            <h3 className="font-semibold mb-2">Prompt Template</h3>
            <div className="bg-muted rounded-md p-4 text-sm font-mono whitespace-pre-wrap">
              {template.prompt}
            </div>
          </div>

          {/* Import button */}
          {onImport && (
            <Button onClick={onImport} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Import Template
            </Button>
          )}

          {/* Review submission form */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">
              {userReview && !isEditing ? "Your Review" : "Write a Review"}
            </h3>

            {userReview && !isEditing ? (
              <div className="bg-muted rounded-md p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= userReview.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditReview}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteReview}
                      disabled={deleteReviewMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                {userReview.reviewText && (
                  <p className="text-sm">{userReview.reviewText}</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Star rating selector */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-8 w-8 cursor-pointer transition-colors ${
                          star <= (hoverRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-200"
                        }`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                      />
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {rating} star{rating !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>

                {/* Review text */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Review (Optional)
                  </label>
                  <Textarea
                    placeholder="Share your experience with this template..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Submit buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={submitReviewMutation.isPending || rating === 0}
                  >
                    {isEditing ? "Update Review" : "Submit Review"}
                  </Button>
                  {isEditing && (
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reviews list */}
          {reviews.length > 0 && (
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">
                Community Reviews ({reviews.length})
              </h3>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-muted rounded-md p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{review.userName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.reviewText && (
                      <p className="text-sm text-muted-foreground">{review.reviewText}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
