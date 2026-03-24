"use client";

import AIAssistant from "@/components/AIAssistant";

export default function AIPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-10">
      <div className="flex items-center gap-4 mb-6">
        <img src="/valorantLogo.png" alt="Valorant Logo" className="h-[48px]" />
        <div>
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            Valorant AI Analysis
          </h1>
          <p className="text-sm text-gray-400">
            Ask natural-language questions about current player performance.
          </p>
        </div>
      </div>

      <AIAssistant />
    </div>
  );
}
