"use client";

import AIAssistant from "@/components/AIAssistant";

export default function AIPage() {
  return (
    <div className="page-shell">
      <div className="content-rise stagger-1 page-hero">
        <img
          src="/valorantLogo.png"
          alt="Valorant Logo"
          className="page-hero-icon"
        />
        <div className="page-hero-copy">
          <h1 className="page-title">Valorant AI Search</h1>
          <p className="page-subtitle">
            Structured AI answers powered by query parsing, retrieval, and
            response formatting.
          </p>
        </div>
      </div>

      <div className="content-rise stagger-2">
        <AIAssistant />
      </div>
    </div>
  );
}
