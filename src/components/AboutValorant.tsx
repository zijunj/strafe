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
    <section className="w-full bg-[#1a1a1a] rounded-lg border border-[#2e2e2e] overflow-hidden">
      {/* Header */}
      <div className="bg-[#202020] px-6 py-4 border-b border-[#2e2e2e]">
        <h2 className="text-lg font-bold text-white">About Valorant</h2>
      </div>

      {/* Description */}
      <div className="p-6">
        <p className="text-gray-300 text-sm leading-relaxed mb-6">
          Valorant is Riot Games&apos; tactical first-person shooter that combines
          precise gunplay with unique agent abilities. Released in June 2020, it
          has become one of the premier esports titles with a thriving competitive
          scene featuring the Valorant Champions Tour (VCT), where the best teams
          from around the world compete for glory and multi-million dollar prize
          pools.
        </p>

        {/* FAQ Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Frequently Asked Questions
          </h3>

          {faqData.map((item, index) => (
            <div
              key={index}
              className="border border-[#2e2e2e] rounded bg-[#151515] overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#1e1e1e] transition-colors"
              >
                <span className="text-sm font-medium text-white">
                  {item.question}
                </span>
                <span
                  className={`text-gray-400 transform transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {openIndex === index && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-[#151515] rounded border border-[#2e2e2e]">
            <div className="text-xl font-bold text-[#FFE44F]">5v5</div>
            <div className="text-xs text-gray-500">Team Format</div>
          </div>
          <div className="text-center p-3 bg-[#151515] rounded border border-[#2e2e2e]">
            <div className="text-xl font-bold text-[#FFE44F]">25+</div>
            <div className="text-xs text-gray-500">Agents</div>
          </div>
          <div className="text-center p-3 bg-[#151515] rounded border border-[#2e2e2e]">
            <div className="text-xl font-bold text-[#FFE44F]">7</div>
            <div className="text-xs text-gray-500">Maps</div>
          </div>
        </div>
      </div>
    </section>
  );
}
