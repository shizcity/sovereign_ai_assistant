import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, FileText, Plus, Trash2, Edit, Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Templates() {
  const { user } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    prompt: "",
    category: "",
  });

  const utils = trpc.useUtils();
  const { data: templates = [] } = trpc.templates.list.useQuery();

  const createTemplate = trpc.templates.create.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      setCreateDialogOpen(false);
      setNewTemplate({ name: "", description: "", prompt: "", category: "" });
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

  const createDefaults = trpc.templates.createDefaults.useMutation({
    onSuccess: () => {
      utils.templates.list.invalidate();
      toast.success("Default templates created");
    },
  });

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.prompt) {
      toast.error("Name and prompt are required");
      return;
    }
    createTemplate.mutate(newTemplate);
  };

  const handleUpdateTemplate = () => {
    if (!selectedTemplate) return;
    updateTemplate.mutate({
      id: selectedTemplate.id,
      name: selectedTemplate.name,
      description: selectedTemplate.description,
      prompt: selectedTemplate.prompt,
      category: selectedTemplate.category,
    });
  };

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setEditDialogOpen(true);
  };

  // Group templates by category
  const templatesByCategory: Record<string, typeof templates> = {};
  templates.forEach((template) => {
    const category = template.category || "Uncategorized";
    if (!templatesByCategory[category]) {
      templatesByCategory[category] = [];
    }
    templatesByCategory[category].push(template);
  });

  if (!user) {
    return <div>Please log in</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-950">
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Chat
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Prompt Templates
              </h1>
              <p className="text-gray-400 mt-1">Create and manage reusable prompts for common tasks</p>
            </div>
          </div>

          <div className="flex gap-2">
            {templates.length === 0 && (
              <Button
                onClick={() => createDefaults.mutate()}
                variant="outline"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                disabled={createDefaults.isPending}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Default Templates
              </Button>
            )}
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500">
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-white/10 max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Template</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Create a reusable prompt template for common tasks
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Template Name</Label>
                    <Input
                      id="name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="e.g., Brainstorming Session"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-white">Category (Optional)</Label>
                    <Input
                      id="category"
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                      placeholder="e.g., Writing, Development, Business"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                      placeholder="Brief description of what this template does"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prompt" className="text-white">Prompt Template</Label>
                    <Textarea
                      id="prompt"
                      value={newTemplate.prompt}
                      onChange={(e) => setNewTemplate({ ...newTemplate, prompt: e.target.value })}
                      placeholder="Write your prompt here. Use [PLACEHOLDERS] for variables that will be filled in later."
                      className="bg-white/5 border-white/10 text-white min-h-[200px]"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tip: Use [TOPIC], [AUDIENCE], [TONE], etc. as placeholders
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateTemplate}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                    disabled={createTemplate.isPending}
                  >
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <Card className="bg-white/5 border-white/10 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No templates yet</h3>
            <p className="text-gray-400 mb-6">
              Create your first template or load the default templates to get started
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => createDefaults.mutate()}
                variant="outline"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                disabled={createDefaults.isPending}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Create Default Templates
              </Button>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Template
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold text-white mb-4">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTemplates.map((template) => (
                    <Card
                      key={template.id}
                      className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                          {template.description && (
                            <p className="text-sm text-gray-400">{template.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {!template.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
                              onClick={() => deleteTemplate.mutate({ id: template.id })}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="bg-black/30 rounded p-3 mt-3">
                        <p className="text-xs text-gray-300 line-clamp-4 font-mono">
                          {template.prompt}
                        </p>
                      </div>
                      {template.isDefault && (
                        <div className="mt-3">
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            Default Template
                          </span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-gray-900 border-white/10 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Template</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update your prompt template
              </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name" className="text-white">Template Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedTemplate.name}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category" className="text-white">Category</Label>
                  <Input
                    id="edit-category"
                    value={selectedTemplate.category || ""}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, category: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description" className="text-white">Description</Label>
                  <Input
                    id="edit-description"
                    value={selectedTemplate.description || ""}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, description: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-prompt" className="text-white">Prompt Template</Label>
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
              <Button
                onClick={handleUpdateTemplate}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500"
                disabled={updateTemplate.isPending}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
