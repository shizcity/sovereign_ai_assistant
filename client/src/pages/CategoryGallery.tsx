import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Download, ArrowLeft, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function CategoryGallery() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: publicCategories = [], isLoading } = trpc.templates.listPublicCategories.useQuery();
  const { data: allPublicTemplates = [] } = trpc.templates.listPublic.useQuery();
  const importMutation = trpc.templates.importCategory.useMutation({
    onSuccess: () => {
      toast.success("Category imported successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to import category: ${error.message}`);
    },
  });
  
  // Filter categories by search query
  const filteredCategories = publicCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get template count for each category
  const getCategoryTemplateCount = (categoryId: number) => {
    return allPublicTemplates.filter((t) => t.categoryId === categoryId).length;
  };
  
  const handleImport = (categoryId: number) => {
    importMutation.mutate({ categoryId });
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading category collections...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/templates">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Templates
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Category Collections
          </h1>
          <p className="text-muted-foreground mt-2">
            Browse and import curated template collections shared by the community
          </p>
        </div>
      </div>
      
      {/* Search */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">No collections found</p>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search query"
                : "No public category collections available yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const templateCount = getCategoryTemplateCount(category.id);
            
            return (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color + "20" }}
                    >
                      <FolderOpen
                        className="w-6 h-6"
                        style={{ color: category.color }}
                      />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <CardDescription>
                    {templateCount} template{templateCount !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Created by</span>
                    <span className="font-medium text-foreground">
                      {category.creatorName || "Anonymous"}
                    </span>
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button
                    onClick={() => handleImport(category.id)}
                    disabled={importMutation.isPending}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Import Collection
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
