"use client";

import { useRouter } from "next/navigation";

interface Props {
  title?: string;
  message: string;
  onClose: () => void;
}

export function UpgradeGate({ title = "Premium Feature 🌸", message, onClose }: Props) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-background rounded-3xl shadow-2xl p-6 space-y-4">
        <div className="text-center space-y-2">
          <p className="text-3xl">🌸</p>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
        </div>

        <div
          className="w-full h-14 rounded-2xl flex items-center justify-center text-white font-bold text-base cursor-pointer active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, #E6567A 0%, #C4458F 100%)" }}
          onClick={() => { onClose(); router.push("/profile"); }}
        >
          Upgrade to Premium — $5.99/mo
        </div>

        <button
          onClick={onClose}
          className="w-full text-sm text-muted-foreground py-2"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
