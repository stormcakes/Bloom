"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen, Search, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Genre =
  | "Law"
  | "History"
  | "Poetry"
  | "Major Prophets"
  | "Minor Prophets"
  | "Gospels"
  | "Epistles"
  | "Prophecy";

interface BibleBook {
  name: string;
  chapters: number;
  genre: Genre;
}

const GENRE_COLORS: Record<Genre, string> = {
  Law: "bg-amber-100 text-amber-700",
  History: "bg-blue-100 text-blue-700",
  Poetry: "bg-purple-100 text-purple-700",
  "Major Prophets": "bg-rose-100 text-rose-700",
  "Minor Prophets": "bg-orange-100 text-orange-700",
  Gospels: "bg-green-100 text-green-700",
  Epistles: "bg-indigo-100 text-indigo-700",
  Prophecy: "bg-red-100 text-red-700",
};

const OLD_TESTAMENT: BibleBook[] = [
  // Law
  { name: "Genesis", chapters: 50, genre: "Law" },
  { name: "Exodus", chapters: 40, genre: "Law" },
  { name: "Leviticus", chapters: 27, genre: "Law" },
  { name: "Numbers", chapters: 36, genre: "Law" },
  { name: "Deuteronomy", chapters: 34, genre: "Law" },
  // History
  { name: "Joshua", chapters: 24, genre: "History" },
  { name: "Judges", chapters: 21, genre: "History" },
  { name: "Ruth", chapters: 4, genre: "History" },
  { name: "1 Samuel", chapters: 31, genre: "History" },
  { name: "2 Samuel", chapters: 24, genre: "History" },
  { name: "1 Kings", chapters: 22, genre: "History" },
  { name: "2 Kings", chapters: 25, genre: "History" },
  { name: "1 Chronicles", chapters: 29, genre: "History" },
  { name: "2 Chronicles", chapters: 36, genre: "History" },
  { name: "Ezra", chapters: 10, genre: "History" },
  { name: "Nehemiah", chapters: 13, genre: "History" },
  { name: "Esther", chapters: 10, genre: "History" },
  // Poetry
  { name: "Job", chapters: 42, genre: "Poetry" },
  { name: "Psalms", chapters: 150, genre: "Poetry" },
  { name: "Proverbs", chapters: 31, genre: "Poetry" },
  { name: "Ecclesiastes", chapters: 12, genre: "Poetry" },
  { name: "Song of Solomon", chapters: 8, genre: "Poetry" },
  // Major Prophets
  { name: "Isaiah", chapters: 66, genre: "Major Prophets" },
  { name: "Jeremiah", chapters: 52, genre: "Major Prophets" },
  { name: "Lamentations", chapters: 5, genre: "Major Prophets" },
  { name: "Ezekiel", chapters: 48, genre: "Major Prophets" },
  { name: "Daniel", chapters: 12, genre: "Major Prophets" },
  // Minor Prophets
  { name: "Hosea", chapters: 14, genre: "Minor Prophets" },
  { name: "Joel", chapters: 3, genre: "Minor Prophets" },
  { name: "Amos", chapters: 9, genre: "Minor Prophets" },
  { name: "Obadiah", chapters: 1, genre: "Minor Prophets" },
  { name: "Jonah", chapters: 4, genre: "Minor Prophets" },
  { name: "Micah", chapters: 7, genre: "Minor Prophets" },
  { name: "Nahum", chapters: 3, genre: "Minor Prophets" },
  { name: "Habakkuk", chapters: 3, genre: "Minor Prophets" },
  { name: "Zephaniah", chapters: 3, genre: "Minor Prophets" },
  { name: "Haggai", chapters: 2, genre: "Minor Prophets" },
  { name: "Zechariah", chapters: 14, genre: "Minor Prophets" },
  { name: "Malachi", chapters: 4, genre: "Minor Prophets" },
];

const NEW_TESTAMENT: BibleBook[] = [
  // Gospels
  { name: "Matthew", chapters: 28, genre: "Gospels" },
  { name: "Mark", chapters: 16, genre: "Gospels" },
  { name: "Luke", chapters: 24, genre: "Gospels" },
  { name: "John", chapters: 21, genre: "Gospels" },
  // History
  { name: "Acts", chapters: 28, genre: "History" },
  // Epistles
  { name: "Romans", chapters: 16, genre: "Epistles" },
  { name: "1 Corinthians", chapters: 16, genre: "Epistles" },
  { name: "2 Corinthians", chapters: 13, genre: "Epistles" },
  { name: "Galatians", chapters: 6, genre: "Epistles" },
  { name: "Ephesians", chapters: 6, genre: "Epistles" },
  { name: "Philippians", chapters: 4, genre: "Epistles" },
  { name: "Colossians", chapters: 4, genre: "Epistles" },
  { name: "1 Thessalonians", chapters: 5, genre: "Epistles" },
  { name: "2 Thessalonians", chapters: 3, genre: "Epistles" },
  { name: "1 Timothy", chapters: 6, genre: "Epistles" },
  { name: "2 Timothy", chapters: 4, genre: "Epistles" },
  { name: "Titus", chapters: 3, genre: "Epistles" },
  { name: "Philemon", chapters: 1, genre: "Epistles" },
  { name: "Hebrews", chapters: 13, genre: "Epistles" },
  { name: "James", chapters: 5, genre: "Epistles" },
  { name: "1 Peter", chapters: 5, genre: "Epistles" },
  { name: "2 Peter", chapters: 3, genre: "Epistles" },
  { name: "1 John", chapters: 5, genre: "Epistles" },
  { name: "2 John", chapters: 1, genre: "Epistles" },
  { name: "3 John", chapters: 1, genre: "Epistles" },
  { name: "Jude", chapters: 1, genre: "Epistles" },
  // Prophecy
  { name: "Revelation", chapters: 22, genre: "Prophecy" },
];

const OT_GENRES: Genre[] = ["Law", "History", "Poetry", "Major Prophets", "Minor Prophets"];
const NT_GENRES: Genre[] = ["Gospels", "History", "Epistles", "Prophecy"];

function BookCard({
  book,
  expandedBook,
  toggleBook,
  suggestions,
  loadingBook,
  fetchSuggestion,
}: {
  book: BibleBook;
  expandedBook: string | null;
  toggleBook: (name: string) => void;
  suggestions: Map<string, string>;
  loadingBook: string | null;
  fetchSuggestion: (name: string) => void;
}) {
  const isExpanded = expandedBook === book.name;
  const suggestion = suggestions.get(book.name);
  const isLoading = loadingBook === book.name;

  return (
    <div className="bloom-card overflow-hidden p-0">
      <button
        onClick={() => toggleBook(book.name)}
        className="w-full flex items-center gap-3 p-4 text-left active:scale-[0.99] transition-transform"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm text-foreground">{book.name}</p>
            <span
              className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                GENRE_COLORS[book.genre]
              )}
            >
              {book.genre}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {book.chapters} {book.chapters === 1 ? "chapter" : "chapters"}
          </p>
        </div>
        <ChevronRight
          className={cn(
            "h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/40 pt-3">
              {!suggestion && !isLoading && (
                <button
                  onClick={() => fetchSuggestion(book.name)}
                  className="flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 rounded-xl px-4 py-2.5 w-full justify-center active:scale-[0.98] transition-transform"
                >
                  <Sparkles className="h-4 w-4" />
                  Get AI Insight ✨
                </button>
              )}
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating insight…
                </div>
              )}
              {suggestion && !isLoading && (
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">AI Insight</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {suggestion}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BibleExplorerPage() {
  const [activeTab, setActiveTab] = useState<"old" | "new">("old");
  const [search, setSearch] = useState("");
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Map<string, string>>(new Map());
  const [loadingBook, setLoadingBook] = useState<string | null>(null);

  const books = activeTab === "old" ? OLD_TESTAMENT : NEW_TESTAMENT;
  const genres = activeTab === "old" ? OT_GENRES : NT_GENRES;

  const filteredBooks =
    search.trim()
      ? [...OLD_TESTAMENT, ...NEW_TESTAMENT].filter((b) =>
          b.name.toLowerCase().includes(search.toLowerCase())
        )
      : null;

  async function fetchSuggestion(bookName: string) {
    if (suggestions.has(bookName)) return;
    setLoadingBook(bookName);
    try {
      const res = await fetch("/api/bible/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book: bookName }),
      });
      const data = await res.json();
      setSuggestions((prev) => new Map(prev).set(bookName, data.suggestion));
    } catch {
      setSuggestions((prev) =>
        new Map(prev).set(bookName, "Unable to load suggestion. Please try again.")
      );
    } finally {
      setLoadingBook(null);
    }
  }

  function toggleBook(bookName: string) {
    setExpandedBook((prev) => (prev === bookName ? null : bookName));
  }

  const sharedProps = { expandedBook, toggleBook, suggestions, loadingBook, fetchSuggestion };

  return (
    <div className="flex flex-col gap-5 px-4 pt-10 pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-full bg-card border border-border/60 flex items-center justify-center shadow-sm flex-shrink-0"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Bible Explorer 📖</h1>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search books…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Search results */}
      {filteredBooks ? (
        <div className="flex flex-col gap-2">
          {filteredBooks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No books found.</p>
          ) : (
            filteredBooks.map((book) => (
              <BookCard key={book.name} book={book} {...sharedProps} />
            ))
          )}
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["old", "new"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setExpandedBook(null);
                }}
                className={cn(
                  "flex-1 py-2.5 text-sm font-semibold transition-colors",
                  activeTab === tab
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground"
                )}
              >
                {tab === "old" ? "Old Testament" : "New Testament"}
              </button>
            ))}
          </div>

          {/* Books by genre */}
          <div className="flex flex-col gap-6">
            {genres.map((genre) => {
              const genreBooks = books.filter((b) => b.genre === genre);
              if (genreBooks.length === 0) return null;
              return (
                <div key={genre} className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    {genre}
                  </p>
                  <div className="flex flex-col gap-2">
                    {genreBooks.map((book) => (
                      <BookCard key={book.name} book={book} {...sharedProps} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
