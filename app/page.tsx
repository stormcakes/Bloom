import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-between px-6 py-12 overflow-hidden relative"
      style={{ background: "linear-gradient(160deg, #FFE8EE 0%, #FDF6F9 60%, #F5EFFF 100%)" }}
    >
      {/* Decorative floral background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-12 left-4 text-5xl opacity-40 animate-float">🌸</div>
        <div className="absolute top-24 right-6 text-3xl opacity-30 animate-float" style={{ animationDelay: "1s" }}>🌺</div>
        <div className="absolute top-8 right-16 text-2xl opacity-25 animate-float" style={{ animationDelay: "0.5s" }}>✿</div>
        <div className="absolute bottom-48 left-6 text-4xl opacity-30 animate-float" style={{ animationDelay: "1.8s" }}>🌷</div>
        <div className="absolute bottom-64 right-4 text-3xl opacity-25 animate-float" style={{ animationDelay: "0.9s" }}>🌸</div>
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center gap-1 z-10">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🌸</span>
          <span className="text-3xl font-bold text-rose-400 tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
            Bloom
          </span>
        </div>
      </div>

      {/* Illustration + tagline */}
      <div className="flex flex-col items-center text-center gap-6 z-10 flex-1 justify-center py-8">
        {/* Illustration placeholder — in production this would be a custom illustration */}
        <div className="relative w-64 h-64">
          {/* Soft glow behind illustration */}
          <div className="absolute inset-4 rounded-full bg-rose-200/40 blur-2xl" />

          {/* Bible & flowers illustration (SVG stand-in) */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-52 h-52 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center shadow-xl shadow-rose-200/50">
              <div className="text-center space-y-1">
                <div className="text-6xl">📖</div>
                <div className="flex justify-center gap-1 text-2xl">
                  <span>🌸</span><span>🌷</span><span>🌸</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating petals */}
          <div className="absolute top-3 right-8 text-xl animate-float" style={{ animationDelay: "0.3s" }}>🌸</div>
          <div className="absolute bottom-8 left-4 text-lg animate-float" style={{ animationDelay: "1.2s" }}>✿</div>
          <div className="absolute top-1/3 left-1 text-sm animate-float" style={{ animationDelay: "0.7s" }}>🌺</div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-700 leading-tight">
            Your faith. Your season.
          </h1>
          <h2 className="text-2xl font-bold text-rose-400 leading-tight">
            God&apos;s word for you.
          </h2>
        </div>

        <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
          A beautiful, personalized devotional companion that meets you exactly where you are.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { icon: "✨", text: "Personalized for You" },
            { icon: "🤝", text: "AI Faith Companion" },
            { icon: "🌿", text: "Beautiful & Calming" },
            { icon: "🌱", text: "For Every Season" },
          ].map(({ icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-rose-100 text-xs text-gray-600 shadow-sm"
            >
              {icon} {text}
            </span>
          ))}
        </div>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col gap-3 w-full max-w-xs z-10">
        <Link
          href="/signup"
          className="w-full h-14 rounded-2xl bg-rose-400 text-white font-semibold text-base flex items-center justify-center shadow-lg shadow-rose-200 active:scale-[0.98] transition-transform"
        >
          Get Started — It&apos;s Free
        </Link>
        <Link
          href="/login"
          className="w-full h-12 rounded-2xl bg-white/80 border border-rose-200 text-rose-400 font-medium text-sm flex items-center justify-center active:scale-[0.98] transition-transform"
        >
          I already have an account
        </Link>
      </div>
    </div>
  );
}
