"use client";

import { useState } from "react";
import { Search, Send, Loader2, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const POPULAR_PASSAGES = [
  { ref: "Psalm 23", label: "The Lord is My Shepherd", preview: "The Lord is my shepherd; I shall not want…" },
  { ref: "John 3:16", label: "God So Loved the World", preview: "For God so loved the world that he gave his one and only Son…" },
  { ref: "Romans 8:28", label: "All Things Work Together", preview: "And we know that in all things God works for the good…" },
  { ref: "Philippians 4:6-7", label: "Peace Beyond Understanding", preview: "Do not be anxious about anything, but in every situation…" },
  { ref: "Jeremiah 29:11", label: "Plans to Prosper You", preview: "For I know the plans I have for you, declares the Lord…" },
  { ref: "Isaiah 40:31", label: "Renewed Strength", preview: "But those who hope in the Lord will renew their strength…" },
  { ref: "Proverbs 3:5-6", label: "Trust in the Lord", preview: "Trust in the Lord with all your heart and lean not on your own understanding…" },
  { ref: "Matthew 11:28", label: "Come to Me", preview: "Come to me, all you who are weary and burdened, and I will give you rest…" },
];

interface VerseResult {
  reference: string;
  text: string;
  explanation: string;
  context: string;
}

export default function BiblePage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerseResult | null>(null);
  const [error, setError] = useState("");

  async function lookup(searchQuery: string) {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/bible/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch {
      setError("Couldn't look that up. Try a book name, verse reference, or topic.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) lookup(query);
  }

  return (
    <div className="flex flex-col min-h-screen px-4 pt-10 pb-28 gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bible</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Search any verse, passage, or topic
        </p>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 pr-2 shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. John 3:16, peace, forgiveness…"
          className="flex-1 bg-transparent text-sm py-3.5 text-foreground placeholder:text-muted-foreground outline-none"
        />
        <button
          onClick={() => lookup(query)}
          disabled={!query.trim() || loading}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
            query.trim() && !loading
              ? "bg-primary text-primary-foreground active:scale-95"
              : "text-muted-foreground"
          )}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bloom-card space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {result.reference}
            </span>
          </div>
          <div className="border-l-2 border-primary/40 pl-4">
            <p className="scripture-text text-foreground/85 text-sm leading-relaxed">
              &ldquo;{result.text}&rdquo;
            </p>
          </div>
          {result.context && (
            <div className="p-3 rounded-xl bg-muted/50">
              <p className="text-xs text-muted-foreground font-medium mb-1">CONTEXT</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{result.context}</p>
            </div>
          )}
          <p className="text-sm text-foreground/80 leading-relaxed">{result.explanation}</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-400 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Popular passages */}
      {!result && !loading && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Popular Passages
          </p>
          <div className="flex flex-col gap-2">
            {POPULAR_PASSAGES.map(({ ref, label, preview }) => (
              <button
                key={ref}
                onClick={() => { setQuery(ref); lookup(ref); }}
                className="bloom-card flex items-center gap-3 text-left active:scale-[0.99] transition-transform hover:border-primary/30"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{ref} · {preview}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
