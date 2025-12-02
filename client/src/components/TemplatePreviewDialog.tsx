import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Download, Eye } from "lucide-react";

interface TemplatePreviewDialogProps {
  template: {
    id: number;
    name: string;
    description: string | null;
    prompt: string;
    categoryId: number | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport?: () => void;
}

/**
 * Extract variables from template prompt
 * Matches patterns like [VARIABLE], [TOPIC], etc.
 */
function extractVariables(prompt: string): string[] {
  const regex = /\[([A-Z_]+)\]/g;
  const variables = new Set<string>();
  let match;
  
  while ((match = regex.exec(prompt)) !== null) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
}

/**
 * Replace variables in template with user values
 */
function replaceVariables(
  prompt: string,
  values: Record<string, string>
): string {
  let result = prompt;
  
  for (const [variable, value] of Object.entries(values)) {
    const pattern = new RegExp(`\\[${variable}\\]`, "g");
    result = result.replace(pattern, value || `[${variable}]`);
  }
  
  return result;
}

export function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onImport,
}: TemplatePreviewDialogProps) {
  const variables = useMemo(
    () => extractVariables(template.prompt),
    [template.prompt]
  );

  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );

  const previewPrompt = useMemo(
    () => replaceVariables(template.prompt, variableValues),
    [template.prompt, variableValues]
  );

  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues((prev) => ({
      ...prev,
      [variable]: value,
    }));
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(previewPrompt);
    toast.success("Copied to clipboard", {
      description: "The generated prompt has been copied",
    });
  };

  const handleImport = () => {
    if (onImport) {
      onImport();
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    setVariableValues({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Eye className="h-6 w-6 text-blue-500" />
                Try Template: {template.name}
              </DialogTitle>
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
          {/* Variable inputs */}
          {variables.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Fill in the variables</h3>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Reset
                </Button>
              </div>
              <div className="space-y-4">
                {variables.map((variable) => (
                  <div key={variable} className="space-y-2">
                    <Label htmlFor={variable} className="text-sm font-medium">
                      {variable.replace(/_/g, " ")}
                    </Label>
                    <Input
                      id={variable}
                      placeholder={`Enter ${variable.toLowerCase().replace(/_/g, " ")}`}
                      value={variableValues[variable] || ""}
                      onChange={(e) =>
                        handleVariableChange(variable, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                This template has no variables. You can preview and use it as-is.
              </p>
            </div>
          )}

          {/* Live preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyToClipboard}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="bg-muted rounded-md p-4 min-h-[120px] max-h-[300px] overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans">
                {previewPrompt}
              </pre>
            </div>
          </div>

          {/* Original template */}
          <div>
            <h3 className="font-semibold mb-2">Original Template</h3>
            <div className="bg-muted rounded-md p-4">
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                {template.prompt}
              </pre>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {onImport && (
            <Button onClick={handleImport}>
              <Download className="h-4 w-4 mr-2" />
              Import Template
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
