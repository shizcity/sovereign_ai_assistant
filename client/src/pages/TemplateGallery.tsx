import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Download, User, Sparkles } from "lucide-react";

export default function TemplateGallery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: publicTemplates = [], isLoading } = trpc.templates.listPublic.useQuery();
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

  // Extract unique categories
  const categories = Array.from(new Set(publicTemplates.map((t) => t.category).filter(Boolean)));

  // Filter templates
  const filteredTemplates = publicTemplates.filter((template) => {
    const matchesSearch =
      !searchQuery ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleImport = (templateId: number) => {
    importMutation.mutate({ templateId });
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
            <Card key={template.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.category && (
                    <Badge variant="secondary" className="shrink-0">
                      {template.category}
                    </Badge>
                  )}
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

              <CardFooter className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{template.creatorName || "Anonymous"}</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleImport(template.id)}
                  disabled={importMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
