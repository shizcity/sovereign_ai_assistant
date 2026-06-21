import { useState, useMemo, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { saveOnboardingStep } from "@/components/OnboardingChecklist";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
<<<<<<< Updated upstream
import { Search, Eye, Download, Globe, Code2, Sparkles, Filter, Star, Calendar, ArrowRight, Copy, Check } from "lucide-react";
=======
import { Search, Eye, Download, Globe, Code2, Sparkles, Star, Calendar, ArrowRight, Copy, Check } from "lucide-react";
>>>>>>> Stashed changes
import { toast } from "sonner";

interface Blueprint {
  id: number; title: string; description: string | null; language: string;
  framework: string | null; code: string; shareToken: string;
  viewCount: number; createdAt: Date;
}

const LANGUAGES = ["all","python","javascript","typescript","bash","sql","other"];

function BlueprintCard({ blueprint }: { blueprint: Blueprint }) {
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  function handleImport() {
    sessionStorage.setItem("glow_import_blueprint", JSON.stringify({ code: blueprint.code, language: blueprint.language, title: blueprint.title }));
    navigate("/code-playground");
    toast.success("Blueprint loaded in Code Playground");
  }
  function handleCopyLink() {
<<<<<<< Updated upstream
    navigator.clipboard.writeText(`${window.location.origin}/blueprint/${blueprint.shareToken}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
=======
    navigator.clipboard.writeText(window.location.origin + "/blueprint/" + blueprint.shareToken).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
>>>>>>> Stashed changes
  }
  return (
    <div className="group rounded-xl border border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15 transition-all duration-200 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white/90 truncate">{blueprint.title}</h3>
          {blueprint.description && <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{blueprint.description}</p>}
        </div>
        <Badge className="shrink-0 text-[10px] px-1.5 py-0 bg-violet-500/15 text-violet-300 border-violet-500/25 capitalize">{blueprint.language}</Badge>
      </div>
      <div className="rounded-lg bg-black/40 border border-white/5 p-2.5 font-mono text-[10px] text-white/30 line-clamp-3 overflow-hidden">{blueprint.code.slice(0, 200)}</div>
      <div className="flex items-center gap-3 text-[11px] text-white/30">
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{blueprint.viewCount}</span>
        {blueprint.framework && <span className="flex items-center gap-1"><Code2 className="w-3 h-3" />{blueprint.framework}</span>}
        <span className="flex items-center gap-1 ml-auto"><Calendar className="w-3 h-3" />{new Date(blueprint.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleImport} className="flex-1 h-7 text-xs bg-violet-600/80 hover:bg-violet-500 text-white"><Download className="w-3 h-3 mr-1" />Import</Button>
        <Button size="sm" variant="outline" onClick={handleCopyLink} className="h-7 px-2 text-xs border-white/10 bg-transparent text-white/50 hover:text-white hover:border-white/20">{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}</Button>
<<<<<<< Updated upstream
        <Link href={`/blueprint/${blueprint.shareToken}`}><Button size="sm" variant="outline" className="h-7 px-2 text-xs border-white/10 bg-transparent text-white/50 hover:text-white hover:border-white/20"><ArrowRight className="w-3 h-3" /></Button></Link>
=======
        <Link href={"/blueprint/" + blueprint.shareToken}><Button size="sm" variant="outline" className="h-7 px-2 text-xs border-white/10 bg-transparent text-white/50 hover:text-white hover:border-white/20"><ArrowRight className="w-3 h-3" /></Button></Link>
>>>>>>> Stashed changes
      </div>
    </div>
  );
}

export default function Marketplace() {
  useEffect(() => { saveOnboardingStep("visit_marketplace"); }, []);
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [langFilter, setLangFilter] = useState("all");
<<<<<<< Updated upstream
  const { data, isLoading } = trpc.blueprints.listPublic.useQuery({ language: langFilter === "all" ? undefined : langFilter, limit: 50 });
=======
  const { data, isLoading } = trpc.blueprints.listPublic.useQuery({
    language: langFilter === "all" ? undefined : langFilter,
    limit: 50,
  });
>>>>>>> Stashed changes
  const filtered = useMemo(() => {
    if (!data?.items) return [];
    if (!search.trim()) return data.items;
    const q = search.toLowerCase();
<<<<<<< Updated upstream
    return data.items.filter((b: Blueprint) => b.title.toLowerCase().includes(q) || (b.description ?? "").toLowerCase().includes(q) || b.language.toLowerCase().includes(q));
=======
    return data.items.filter((b: Blueprint) =>
      b.title.toLowerCase().includes(q) ||
      (b.description ?? "").toLowerCase().includes(q) ||
      b.language.toLowerCase().includes(q)
    );
>>>>>>> Stashed changes
  }, [data?.items, search]);
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        <div className="px-6 pt-6 pb-4 border-b border-white/8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2"><Globe className="w-5 h-5 text-violet-400" />Blueprint Marketplace</h1>
              <p className="text-sm text-white/40 mt-0.5">Discover and import community agent blueprints</p>
            </div>
            <Button size="sm" onClick={() => navigate("/code-playground")} className="bg-violet-600/80 hover:bg-violet-500 text-white text-xs"><Sparkles className="w-3.5 h-3.5 mr-1.5" />Create Blueprint</Button>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search blueprints..." className="pl-8 h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-white/25" />
            </div>
            <div className="flex gap-1 flex-wrap">
              {LANGUAGES.map((lang) => (
<<<<<<< Updated upstream
                <button key={lang} onClick={() => setLangFilter(lang)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize ${langFilter === lang ? "bg-violet-600/80 text-white" : "bg-white/5 text-white/40 hover:text-white/70"}`}>{lang === "all" ? "All" : lang}</button>
              ))}
            </div>
=======
                <button key={lang} onClick={() => setLangFilter(lang)} className={"px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize " + (langFilter === lang ? "bg-violet-600/80 text-white" : "bg-white/5 text-white/40 hover:text-white/70")}>{lang === "all" ? "All" : lang}</button>
              ))}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-white/30">
              <Star className="w-3 h-3" /><span>Sorted by popularity</span>
            </div>
>>>>>>> Stashed changes
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({length:6}).map((_,i)=><div key={i} className="rounded-xl border border-white/8 bg-white/3 p-4 h-52 animate-pulse"/>)}</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Globe className="w-10 h-10 text-white/10 mb-3"/>
              <p className="text-sm text-white/30">{search ? "No blueprints match your search" : "No public blueprints yet"}</p>
              <Button size="sm" onClick={() => navigate("/code-playground")} className="mt-4 bg-violet-600/80 hover:bg-violet-500 text-white text-xs">Be the first to share one</Button>
            </div>
          ) : (
            <>
<<<<<<< Updated upstream
              <p className="text-xs text-white/25 mb-3">{filtered.length} blueprint{filtered.length !== 1 ? "s" : ""}{search ? ` matching "${search}"` : ""}</p>
=======
              <p className="text-xs text-white/25 mb-3">{filtered.length} blueprint{filtered.length !== 1 ? "s" : ""}{search ? (" matching " + search) : ""}</p>
>>>>>>> Stashed changes
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{filtered.map((bp: Blueprint) => <BlueprintCard key={bp.id} blueprint={bp}/>)}</div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
