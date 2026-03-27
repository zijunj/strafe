"use client";

import { useState, useEffect } from "react";
import useValorantApiWithCache from "../app/api/Valorant";

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

  const featured = newsData.find(
    (item) =>
      articleImg &&
      item.title.trim().toLowerCase() === articleImg.title.trim().toLowerCase(),
  );

  const rest = newsData.filter(
    (item) =>
      !articleImg ||
      item.title.trim().toLowerCase() !== articleImg.title.trim().toLowerCase(),
  );

  if (loading) {
    return (
      <div className="p-4">
        <p className="body-text">Loading...</p>
      </div>
    );
  }

  if (!newsData || newsData.length === 0) {
    return (
      <div className="p-4">
        <p className="body-text">No news found.</p>
      </div>
    );
  }

  return (
    <section className="w-full text-[var(--color-text-primary)]">
      {newsView === "featured" ? (
        <div className="relative card h-[366px] w-full overflow-hidden group">
          <div className="relative h-[310px] w-full overflow-hidden">
            {articleImg && (
              <div
                className="absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 ease-in-out scale-100 group-hover:scale-105 group-hover:brightness-110"
                style={{ backgroundImage: `url(${articleImg.img})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-bg-surface)]" />
          </div>

          <div className="relative -mt-24 px-6 pb-4">
            <h2 className="card-title mb-2">{featured?.title}</h2>
            <p className="body-text mb-2 line-clamp-3">{featured?.description}</p>
            <div className="text-xs text-[var(--color-text-muted)] mb-4">
              {featured?.date} • {featured?.author}
            </div>
            <a
              href={featured?.url_path}
              target="_blank"
              rel="noopener noreferrer"
              className="link-accent"
            >
              Read more →
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rest.slice(0, 6).map((item, i) => (
            <article
              key={i}
              className="card hover:bg-[var(--color-bg-surface-elevated)] transition"
            >
              <div className="card-body">
                <h3 className="card-title mb-2">{item.title}</h3>
                <p className="body-text mb-2 line-clamp-3">{item.description}</p>
                <div className="text-xs text-[var(--color-text-muted)] mb-4">
                  {item.date} • {item.author}
                </div>
                <a
                  href={item.url_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-accent"
                >
                  Read more →
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
