"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { UpgradeGate } from "@/components/UpgradeGate";

const SUGGESTION_BUTTONS = [
  { icon: "🙏", text: "Yes, please pray for me" },
  { icon: "📖", text: "What does the Bible say about anxiety?" },
  { icon: "🕊️", text: "Give me a verse to remind me of God's peace" },
];

const QUICK_PROMPTS = [
  "I'm feeling anxious about something tomorrow.",
  "How can I get closer to God?",
  "I keep messing up. Am I too far gone?",
  "Give me encouragement for today.",
  "Can you explain John 3:16?",
  "Help me understand forgiveness.",
];

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userName, setUserName] = useState("Friend");
  const [showUpgradeGate, setShowUpgradeGate] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput, append } = useChat({
    api: "/api/chat",
    body: { session_id: sessionId },
    onError: async (error) => {
      try {
        const body = JSON.parse((error as Error).message);
        if (body?.error === "limit_reached") {
          setUpgradeMessage(body.message);
          setShowUpgradeGate(true);
        }
      } catch { /* not a JSON error */ }
    },
  });

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const [{ data: session }, { data: profile }] = await Promise.all([
        supabase.from("chat_sessions").insert({ context: "general" }).select().single(),
        supabase.from("user_profiles").select("display_name").single(),
      ]);
      if (session) setSessionId(session.id);
      if (profile) setUserName(profile.display_name?.split(" ")[0] ?? "Friend");
    }
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendQuickPrompt(text: string) {
    append({ role: "user", content: text });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey && input.trim() && !isLoading) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100dvh-3.5rem)]">
      {showUpgradeGate && (
        <UpgradeGate
          message={upgradeMessage || `You've used all ${10} free AI chat messages this month. Upgrade to Premium for unlimited conversations with Bloom.`}
          onClose={() => setShowUpgradeGate(false)}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-2xl shadow-sm">
            🌸
          </div>
          <div>
            <p className="font-bold text-foreground text-base">Bloom AI</p>
            <p className="text-xs text-muted-foreground">Your faith companion</p>
          </div>
        </div>
        <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <Search className="h-4 w-4 text-muted-foreground" strokeWidth={1.8} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Bloom greeting */}
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
                🌸
              </div>
              <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80%] shadow-sm">
                <p className="text-sm text-foreground leading-relaxed">
                  Hey {userName}! 🌸
                  <br />
                  How can I encourage you today?
                </p>
              </div>
            </div>

            {/* Quick prompts */}
            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendQuickPrompt(prompt)}
                  className="w-full text-left px-4 py-3 rounded-2xl border border-border/60 bg-card text-sm text-foreground hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98] transition-all shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <p className="text-center text-xs text-muted-foreground/60 px-6">
              Bloom is an AI companion, not a licensed counselor. For crisis support in the US, call or text 988.
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((message, i) => {
            const isUser = message.role === "user";
            const isLastAssistant = !isUser && i === messages.length - 1;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={cn("flex gap-3", isUser && "flex-row-reverse")}
              >
                {!isUser && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
                    🌸
                  </div>
                )}
                <div className="flex flex-col gap-2 max-w-[80%]">
                  <div
                    className={cn(
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border border-border/60 text-foreground rounded-bl-sm"
                    )}
                  >
                    {isUser ? (
                      <p>{message.content}</p>
                    ) : (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          em: ({ children }) => <em className="italic opacity-80">{children}</em>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    )}
                  </div>

                  {/* Suggestion buttons after last assistant message */}
                  {isLastAssistant && !isLoading && (
                    <div className="flex flex-col gap-1.5 mt-1">
                      {SUGGESTION_BUTTONS.map(({ icon, text }) => (
                        <button
                          key={text}
                          onClick={() => sendQuickPrompt(text)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-border/60 bg-card/80 text-sm text-foreground hover:border-primary/50 active:scale-[0.98] transition-all text-left shadow-sm"
                        >
                          <span>{icon}</span>
                          <span className="text-xs">{text}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center text-xl flex-shrink-0">
              🌸
            </div>
            <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 150, 300].map((delay) => (
                  <div
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border/30 bg-background/90 backdrop-blur-sm px-4 py-3 pb-safe">
        <div className="flex items-center gap-2 bg-muted/60 rounded-2xl px-4 pr-2 border border-border/50">
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Bloom AI…"
            className="flex-1 bg-transparent text-sm py-3 text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={!input.trim() || isLoading}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground active:scale-95"
                : "text-muted-foreground"
            )}
          >
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Send className="h-4 w-4" />
            }
          </button>
        </div>
      </div>
    </div>
  );
}
