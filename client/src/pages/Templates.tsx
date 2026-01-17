import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, FileText, Plus, Trash2, Edit, Sparkles, Globe, Lock, FolderPlus, Palette, Search, Play } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

export default function Templates() {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    prompt: "",
    categoryId: null as number | null,
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#3b82f6",
  });

  const utils = trpc.useUtils();
  const { data: templates = [] } = trpc.templates.list.useQuery();
  const { data: categories = [] } = trpc.templates.listCategories.useQuery();

  const createTemplate = trpc.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      setCreateDialogOpen(false);
      setNewTemplate({ name: "", description: "", prompt: "", categoryId: null });
      toast.success("Template created");
    },
  });

  const updateTemplate = trpc.templates.update.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      setEditDialogOpen(false);
      setSelectedTemplate(null);
      toast.success("Template updated");
    },
  });

  const deleteTemplate = trpc.templates.delete.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      toast.success("Template deleted");
    },
  });

  const togglePublic = trpc.templates.togglePublic.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      toast.success("Template visibility updated");
    },
  });

  const createCategory = trpc.templates.createCategory.useMutation({
    onSuccess: () => {
      utils.templates.listCategories.invalidate();
      setCategoryDialogOpen(false);
      setNewCategory({ name: "", color: "#3b82f6" });
      toast.success("Category created");
    },
  });

  const createDefaultCategories = trpc.templates.createDefaultCategories.useMutation({
    onSuccess: () => {
      utils.templates.listCategories.invalidate();
      toast.success("Default categories created");
    },
  });

  const toggleCategoryPublic = trpc.templates.toggleCategoryPublic.useMutation({
    onSuccess: () => {
      utils.templates.listCategories.invalidate();
      toast.success("Category visibility updated");
    },
  });

  const handleUseTemplate = (templateId: number) => {
    // Navigate to chat and pass template ID as URL parameter
    setLocation(`/chat?templateId=${templateId}`);
  };

  // Filter templates based on search query and category
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = searchQuery === "" ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategoryFilter === null ||
      template.categoryId === selectedCategoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = () => {
    createTemplate.mutate({
      name: newTemplate.name,
      description: newTemplate.description,
      prompt: newTemplate.prompt,
      categoryId: newTemplate.categoryId,
    });
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplate) return;
    updateTemplate.mutate({
      id: selectedTemplate.id,
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      prompt: selectedTemplate.prompt,
      categoryId: selectedTemplate.categoryId,
    });
  };

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setEditDialogOpen(true);
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplate.mutate({ id });
    }
  };

  const handleTogglePublic = (id: number, currentStatus: boolean) => {
    togglePublic.mutate({ id, isPublic: !currentStatus });
  };

  const handleCreateCategory = () => {
    createCategory.mutate(newCategory);
  };

  // Group filtered templates by category
  const templatesByCategory: Record<string, typeof templates> = {
    "Uncategorized": [],
  };
  
  categories.forEach((cat) => {
    templatesByCategory[cat.name] = [];
  });

  filteredTemplates.forEach((template) => {
    const category = categories.find((c) => c.id === template.categoryId);
    const categoryName = category?.name || "Uncategorized";
    if (!templatesByCategory[categoryName]) {
      templatesByCategory[categoryName] = [];
    }
    templatesByCategory[categoryName].push(template);
  });

  // Get category color
  const getCategoryColor = (categoryId: number | null) => {
    if (!categoryId) return "#6b7280"; // Gray for uncategorized
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || "#3b82f6";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/chat">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Chat
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <FileText className="h-8 w-8" />
                My Templates
              </h1>
              <p className="text-white/60 mt-1">Create and manage reusable prompt templates</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/template-gallery">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Globe className="h-4 w-4 mr-2" />
                Browse Gallery
              </Button>
            </Link>
            <Link href="/category-gallery">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <FolderPlus className="h-4 w-4 mr-2" />
                Browse Collections
              </Button>
            </Link>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Category
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle>Create Category</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Create a custom category to organize your templates
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category-name">Category Name</Label>
                    <Input
                      id="category-name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="e.g., Marketing, Development"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category-color">Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="category-color"
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        className="w-20 h-10 bg-white/5 border-white/10"
                      />
                      <Input
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        placeholder="#3b82f6"
                        className="flex-1 bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateCategory}
                    disabled={!newCategory.name}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Category
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Template</DialogTitle>
                  <DialogDescription className="text-white/60">
                    Create a new reusable prompt template
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="e.g., Blog Post Outline"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                      placeholder="Brief description of what this template does"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category (Optional)</Label>
                    <Select
                      value={newTemplate.categoryId?.toString() || "none"}
                      onValueChange={(value) =>
                        setNewTemplate({ ...newTemplate, categoryId: value === "none" ? null : parseInt(value) })
                      }
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10 text-white">
                        <SelectItem value="none">No category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prompt">Prompt Template</Label>
                    <Textarea
                      id="prompt"
                      value={newTemplate.prompt}
                      onChange={(e) => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
                      placeholder="Enter your prompt template here. Use [VARIABLE] for placeholders."
                      className="bg-white/5 border-white/10 text-white min-h-[200px]"
                    />
                    <p className="text-sm text-white/40 mt-1">
                      Tip: Use [VARIABLE] syntax for placeholders (e.g., [TOPIC], [AUDIENCE])
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateTemplate}
                    disabled={!newTemplate.name || !newTemplate.prompt}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Actions */}
        {templates.length === 0 && categories.length === 0 && (
          <Card className="bg-white/5 border-white/10 mb-8">
            <CardContent className="p-6">
              <p className="text-white/60 mb-4">Get started by creating default categories for your templates</p>
              <Button
                onClick={() => createDefaultCategories.mutate()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create Default Categories
              </Button>
            </CardContent>
          </Card>
        )}
        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              type="text"
              placeholder="Search templates by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <Select
            value={selectedCategoryFilter?.toString() || "all"}
            onValueChange={(value) => setSelectedCategoryFilter(value === "all" ? null : parseInt(value))}
          >
            <SelectTrigger className="w-[200px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-white/10 text-white">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Template Categories and List */}
        <div className="space-y-6">     {Object.entries(templatesByCategory).map(([categoryName, categoryTemplates]) => {
            if (categoryTemplates.length === 0) return null;
            
            const category = categories.find((c) => c.name === categoryName);
            const categoryColor = category?.color || "#6b7280";

            return (
              <div key={categoryName}>
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: categoryColor }}
                  />
                  <h2 className="text-2xl font-bold">{categoryName}</h2>
                  <Badge variant="secondary" className="ml-2">
                    {categoryTemplates.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTogglePublic(template.id, template.isPublic === 1)}
                              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                              title={template.isPublic === 1 ? "Make private" : "Make public"}
                            >
                              {template.isPublic === 1 ? (
                                <Globe className="h-4 w-4" />
                              ) : (
                                <Lock className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditTemplate(template)}
                              className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-white/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="h-8 w-8 p-0 text-white/60 hover:text-red-400 hover:bg-white/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {template.description && (
                          <CardDescription className="text-white/60">
                            {template.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-white/40 line-clamp-3">{template.prompt}</p>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center">
                        <div className="flex gap-2">
                          {template.isPublic === 1 && (
                            <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
                              Public
                            </Badge>
                          )}
                          {template.isDefault === 1 && (
                            <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                              Default
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template.id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Edit Template Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Template</DialogTitle>
              <DialogDescription className="text-white/60">
                Update your template details
              </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Template Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedTemplate.name}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={selectedTemplate.description || ""}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={selectedTemplate.categoryId?.toString() || "none"}
                    onValueChange={(value) =>
                      setSelectedTemplate({ ...selectedTemplate, categoryId: value === "none" ? null : parseInt(value) })
                    }
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10 text-white">
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-prompt">Prompt Template</Label>
                  <Textarea
                    id="edit-prompt"
                    value={selectedTemplate.prompt}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, prompt: e.target.value })}
                    className="bg-white/5 border-white/10 text-white min-h-[200px]"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={handleUpdateTemplate} className="bg-blue-600 hover:bg-blue-700">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
