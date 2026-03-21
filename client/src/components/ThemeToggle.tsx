import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  /** Visual style: "icon" = compact icon button, "pill" = labeled pill toggle */
  variant?: "icon" | "pill";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className }: ThemeToggleProps) {
  const { theme, toggleTheme, switchable } = useTheme();

  if (!switchable || !toggleTheme) return null;

  const isDark = theme === "dark";

  if (variant === "pill") {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
          "border",
          isDark
            ? "bg-white/8 border-white/12 text-white/70 hover:bg-white/12 hover:text-white/90"
            : "bg-black/6 border-black/10 text-black/60 hover:bg-black/10 hover:text-black/80",
          className
        )}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <span
          className={cn(
            "transition-all duration-300",
            isDark ? "rotate-0 opacity-100" : "rotate-90 opacity-0 absolute"
          )}
        >
          <Moon className="w-3.5 h-3.5" />
        </span>
        <span
          className={cn(
            "transition-all duration-300",
            !isDark ? "rotate-0 opacity-100" : "-rotate-90 opacity-0 absolute"
          )}
        >
          <Sun className="w-3.5 h-3.5" />
        </span>
        <span>{isDark ? "Dark" : "Light"}</span>
      </button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className={cn(
            "relative w-8 h-8 rounded-lg overflow-hidden transition-all duration-300",
            isDark
              ? "text-white/50 hover:text-white/80 hover:bg-white/8"
              : "text-black/50 hover:text-black/80 hover:bg-black/6",
            className
          )}
        >
          {/* Sun icon — visible in dark mode (click to go light) */}
          <Sun
            className={cn(
              "absolute w-4 h-4 transition-all duration-300",
              isDark
                ? "opacity-100 rotate-0 scale-100"
                : "opacity-0 -rotate-90 scale-50"
            )}
          />
          {/* Moon icon — visible in light mode (click to go dark) */}
          <Moon
            className={cn(
              "absolute w-4 h-4 transition-all duration-300",
              !isDark
                ? "opacity-100 rotate-0 scale-100"
                : "opacity-0 rotate-90 scale-50"
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        {isDark ? "Switch to light mode" : "Switch to dark mode"}
      </TooltipContent>
    </Tooltip>
  );
}
