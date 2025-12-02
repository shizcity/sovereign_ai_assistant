import { useState } from "react";
import { TemplateDetailDialog } from "@/components/TemplateDetailDialog";
import { TemplatePreviewDialog } from "@/components/TemplatePreviewDialog";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Download, User, Sparkles, Star, TrendingUp, Trophy, Award, Eye } from "lucide-react";

export default function TemplateGallery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "rating">("rating");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof publicTemplates[0] | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<typeof publicTemplates[0] | null>(null);

  const { data: publicTemplates = [], isLoading } = trpc.templates.listPublic.useQuery();
  
  // Fetch featured templates
  const { data: featuredTemplates = [] } = trpc.templates.getFeatured.useQuery(
    { limit: 6 },
    { enabled: true }
  );
  
  // Fetch ratings for all public templates
  const templateIds = publicTemplates.map(t => t.id);
  const { data: ratingsData = [] } = trpc.templates.getRatings.useQuery(
    { templateIds },
    { enabled: templateIds.length > 0 }
  );
  
  // Create a map of template ID to rating data
  const ratingsMap = new Map(
    ratingsData.map(r => [r.templateId, r])
  );
  const importMutation = trpc.templates.import.useMutation({
    onSuccess: () => {
      toast.success("Template imported", {
        description: "The template has been added to your collection",
      });
    },
    onError: (error) => {
      toast.error("Import failed", {
        description: error.message,
      });
    },
  });

  // TODO: Fetch categories and map categoryId to category names
  const categories: string[] = [];

  // Filter and sort templates
  const filteredTemplates = publicTemplates
    .filter((template) => {
      const matchesSearch =
        !searchQuery ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = true; // TODO: Update to use categoryId
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "rating") {
        const ratingA = ratingsMap.get(a.id)?.averageRating || 0;
        const ratingB = ratingsMap.get(b.id)?.averageRating || 0;
        return ratingB - ratingA; // Highest rating first
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const handleImport = (templateId: number) => {
    importMutation.mutate({ templateId });
  };
  
  const handleViewDetails = (template: typeof publicTemplates[0]) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Template Gallery</h1>
        </div>
        <p className="text-muted-foreground">
          Browse and import templates shared by the community
        </p>
      </div>

      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
        
        {/* Sort options */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Button
            variant={sortBy === "rating" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("rating")}
          >
            <Star className="h-3 w-3 mr-1" />
            Highest Rated
          </Button>
          <Button
            variant={sortBy === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => setSortBy("recent")}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Most Recent
          </Button>
        </div>
      </div>

      {/* Featured Templates Section */}
      {featuredTemplates.length > 0 && !searchQuery && !selectedCategory && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold">Featured Templates</h2>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              Top Rated
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTemplates.map((template) => (
              <Card
                key={template.id}
                className="flex flex-col cursor-pointer hover:shadow-lg transition-all border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white relative overflow-hidden"
                onClick={() => handleViewDetails(template)}
              >
                {/* Featured badge */}
                <div className="absolute top-3 right-3">
                  <Award className="h-6 w-6 text-yellow-500 fill-yellow-100" />
                </div>
                
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 pr-8">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {/* TODO: Add category badge based on categoryId */}
                  </div>
                  {template.description && (
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="bg-muted rounded-md p-3 text-sm font-mono text-muted-foreground line-clamp-4">
                    {template.prompt}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{template.creatorName || "Anonymous"}</span>
                    </div>
                    
                    {/* Rating display */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= Math.round(template.averageRating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-sm font-semibold text-yellow-700 ml-1">
                        {template.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({template.reviewCount})
                      </span>
                    </div>
                  </div>
                  <div className="w-full flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Try It
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImport(template.id);
                      }}
                      disabled={importMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Import
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Templates Section */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">
          {searchQuery || selectedCategory ? "Search Results" : "All Templates"}
        </h2>
      </div>

      {/* Templates grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {searchQuery || selectedCategory
              ? "No templates match your filters"
              : "No public templates available yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleViewDetails(template)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {/* TODO: Add category badge based on categoryId */}
                </div>
                {template.description && (
                  <CardDescription className="line-clamp-2">{template.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex-1">
                <div className="bg-muted rounded-md p-3 text-sm font-mono text-muted-foreground line-clamp-4">
                  {template.prompt}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{template.creatorName || "Anonymous"}</span>
                  </div>
                  
                  {/* Rating display */}
                  {(() => {
                    const rating = ratingsMap.get(template.id);
                    const avgRating = rating?.averageRating || 0;
                    const reviewCount = rating?.reviewCount || 0;
                    
                    return (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(avgRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">
                          {avgRating > 0 ? avgRating.toFixed(1) : "No ratings"}
                          {reviewCount > 0 && ` (${reviewCount})`}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="w-full flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Try It
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleImport(template.id)}
                    disabled={importMutation.isPending}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Import
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Template detail dialog */}
      {selectedTemplate && (
        <TemplateDetailDialog
          template={selectedTemplate}
          open={!!selectedTemplate}
          onOpenChange={(open) => !open && setSelectedTemplate(null)}
          onImport={() => {
            handleImport(selectedTemplate.id);
            setSelectedTemplate(null);
          }}
        />
      )}
      
      {/* Template preview dialog */}
      {previewTemplate && (
        <TemplatePreviewDialog
          template={previewTemplate}
          open={!!previewTemplate}
          onOpenChange={(open) => !open && setPreviewTemplate(null)}
          onImport={() => {
            handleImport(previewTemplate.id);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
}
