import { useState, useEffect } from "react";
import useValorantApiWithCache from "../api/Valorant.js";

export default function News(props) {
  const { data: newsData, loading } = useValorantApiWithCache({
    key: "news",
    url: "/api/news",
    parse: (res) => res.data.segments,
  });

  if (loading) return <p>Loading...</p>;

  return (
    <section className="max-w-4xl p-6 text-white">
      {newsData?.slice(0, 1).map((item, i) => (
        <article key={i}>
          <h2 className="text-2xl font-bold mb-2">{item.title}</h2>
          <p className="text-gray-300 text-sm mb-2">{item.description}</p>
          <div className="text-xs text-gray-400 mb-4">
            Date: {item.date} • Author: {item.author}
          </div>
          <a
            href={item.url_path}
            target="_blank"
            className="inline-block text-yellow-300 hover:underline"
          >
            Read more →
          </a>
        </article>
      ))}
    </section>
  );
}
