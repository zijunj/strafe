"use client";

import { useState, useEffect } from "react";
import useValorantApiWithCache from "../app/api/Valorant";

// Define expected structure for news item
interface NewsItem {
  title: string;
  description: string;
  date: string;
  author: string;
  url_path: string;
}

export default function News() {
  const { data: newsData, loading } = useValorantApiWithCache<NewsItem[]>({
    key: "news",
    url: "news",
    parse: (res) => res.data?.segments || [],
  });

  if (loading) return <p className="text-white">Loading...</p>;
  if (!newsData || newsData.length === 0)
    return <p className="text-white">No news found.</p>;

  return (
    <section className="max-w-4xl p-6 text-white">
      {newsData.slice(0, 1).map((item, i) => (
        <article key={i}>
          <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
          <p className="text-gray-300 text-sm mb-2">{item.description}</p>
          <div className="text-xs text-gray-400 mb-4">
            Date: {item.date} • Author: {item.author}
          </div>
          <a
            href={item.url_path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-yellow-300 hover:underline"
          >
            Read more →
          </a>
        </article>
      ))}
    </section>
  );
}
