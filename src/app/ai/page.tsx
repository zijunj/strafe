"use client";

import AIAssistant from "@/components/AIAssistant";

export default function AIPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-10">
      <div className="mb-6 flex items-center gap-4">
        <img src="/valorantLogo.png" alt="Valorant Logo" className="h-[48px]" />
        <div>
          <h1 className="text-3xl font-extrabold leading-tight text-white">
            Valorant AI Search
          </h1>
          <p className="text-sm text-gray-400">
            Structured AI answers powered by query parsing, retrieval, and
            response formatting.
          </p>
        </div>
      </div>

      <AIAssistant />
    </div>
  );
}
