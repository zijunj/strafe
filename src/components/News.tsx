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

type NewsImg = {
  img: string;
  title: string;
};

interface NewsProps {
  newsView: string;
}

export default function News({ newsView }: NewsProps) {
  const { data: newsData, loading } = useValorantApiWithCache<NewsItem[]>({
    key: "news",
    url: "news",
    parse: (res) => res.data?.segments || [],
  });

  const [articleImg, setArticleImg] = useState<NewsImg | null>(null);

  useEffect(() => {
    const fetchNewsImg = async () => {
      const res = await fetch("/api/newsImg");
      const data = await res.json();
      setArticleImg(data.articles[0]);
    };

    fetchNewsImg();
  }, []);

  // Find the featured article from newsData by title match
  const featured = newsData.find(
    (item) =>
      articleImg &&
      item.title.trim().toLowerCase() === articleImg.title.trim().toLowerCase()
  );

  // Filter the rest of the articles to exclude the featured one
  const rest = newsData.filter(
    (item) =>
      !articleImg ||
      item.title.trim().toLowerCase() !== articleImg.title.trim().toLowerCase()
  );

  if (loading) return <p className="text-white">Loading...</p>;
  if (!newsData || newsData.length === 0)
    return <p className="text-white">No news found.</p>;

  return (
    <section className="w-full text-white">
      {newsView === "featured" ? (
        // ⭐ Featured News Layout
        <div className="relative bg-[#151515] h-[366px] w-full rounded-lg overflow-hidden border border-[#151515] ring-1 ring-stone-700 group">
          <div className="relative h-[310px] w-full overflow-hidden">
            {articleImg && (
              <div
                className="absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 ease-in-out scale-100 group-hover:scale-105 group-hover:brightness-110"
                style={{ backgroundImage: `url(${articleImg.img})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#151515]" />
          </div>

          <div className="relative -mt-24 px-6 pb-4">
            <h2 className="text-2xl font-bold mb-2">{featured?.title}</h2>
            <p className="text-gray-300 text-sm mb-2 line-clamp-3">
              {featured?.description}
            </p>
            <div className="text-xs text-gray-400 mb-4">
              {featured?.date} • {featured?.author}
            </div>
            <a
              href={featured?.url_path}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-yellow-300 hover:underline"
            >
              Read more →
            </a>
          </div>
        </div>
      ) : (
        // 📰 Normal News List Layout
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rest.slice(0, 6).map((item, i) => (
            <article
              key={i}
              className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a] hover:bg-[#222] transition"
            >
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 mb-2 line-clamp-3">
                {item.description}
              </p>
              <div className="text-xs text-gray-500 mb-4">
                {item.date} • {item.author}
              </div>
              <a
                href={item.url_path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-300 hover:underline"
              >
                Read more →
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
