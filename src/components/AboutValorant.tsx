"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What is Valorant?",
    answer:
      "Valorant is a free-to-play first-person tactical hero shooter developed and published by Riot Games. It was released in June 2020 and quickly became one of the most popular competitive FPS games in the esports scene.",
  },
  {
    question: "When was Valorant released?",
    answer:
      "Valorant was officially released on June 2, 2020, after a successful closed beta period that began in April 2020. The game was developed by Riot Games, known for League of Legends.",
  },
  {
    question: "How does Valorant gameplay work?",
    answer:
      "Valorant is a 5v5 tactical shooter where one team attacks and the other defends. The attacking team tries to plant a bomb (Spike) while the defending team tries to stop them. Each player selects an 'Agent' with unique abilities that complement gunplay.",
  },
  {
    question: "What are Agents in Valorant?",
    answer:
      "Agents are playable characters in Valorant, each with unique abilities. There are four roles: Duelists (entry fraggers), Initiators (create opportunities), Controllers (smoke/area denial), and Sentinels (defensive support).",
  },
  {
    question: "What is the Valorant Champions Tour (VCT)?",
    answer:
      "The Valorant Champions Tour is Riot Games' official international esports tournament series. It consists of three international leagues (Americas, EMEA, Pacific), Challenger leagues, Masters tournaments, and the World Championship called Champions.",
  },
];

export default function AboutValorant() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">About Valorant</h2>
      </div>

      <div className="card-body">
        <p className="body-text mb-6">
          Valorant is Riot Games&apos; tactical first-person shooter that combines
          precise gunplay with unique agent abilities. Released in June 2020, it
          has become one of the premier esports titles with a thriving competitive
          scene featuring the Valorant Champions Tour (VCT), where the best teams
          from around the world compete for glory and multi-million dollar prize
          pools.
        </p>

        <div className="space-y-2">
          <h3 className="label mb-3">Frequently Asked Questions</h3>

          {faqData.map((item, index) => (
            <div key={index} className="card overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-surface-elevated)]"
              >
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {item.question}
                </span>
                <span
                  className={`text-[var(--color-text-muted)] transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                >
                  v
                </span>
              </button>

              {openIndex === index && (
                <div className="px-4 pb-4">
                  <p className="body-text">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="card p-3 text-center">
            <div className="text-xl font-bold text-[var(--color-primary)]">5v5</div>
            <div className="text-xs text-[var(--color-text-muted)]">Team Format</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-xl font-bold text-[var(--color-primary)]">25+</div>
            <div className="text-xs text-[var(--color-text-muted)]">Agents</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-xl font-bold text-[var(--color-primary)]">7</div>
            <div className="text-xs text-[var(--color-text-muted)]">Maps</div>
          </div>
        </div>
      </div>
    </section>
  );
}
