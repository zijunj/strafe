"use client";

import { useEffect, useState } from "react";
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
  url: string;
  description?: string | null;
};

interface NewsProps {
  newsView: string;
}

function normalizeNewsTitle(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeNewsUrl(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+/i, "");
}

export default function News({ newsView }: NewsProps) {
  const { data: newsData, loading } = useValorantApiWithCache<NewsItem[]>({
    key: "news-storage",
    url: "storage/news",
    parse: (res) => res.data?.segments || [],
  });

  const [articleImg, setArticleImg] = useState<NewsImg | null>(null);

  useEffect(() => {
    const fetchNewsImg = async () => {
      try {
        const res = await fetch("/api/newsImg");

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        const firstArticle = Array.isArray(data?.articles)
          ? data.articles[0]
          : null;

        if (firstArticle?.img && firstArticle?.title && firstArticle?.url) {
          setArticleImg(firstArticle);
        }
      } catch (error) {
        console.error("Failed to load news image:", error);
      }
    };

    fetchNewsImg();
  }, []);

  const matchedFeaturedNews =
    newsData.find(
      (item) =>
        articleImg &&
        (normalizeNewsUrl(item.url_path) === normalizeNewsUrl(articleImg.url) ||
          normalizeNewsTitle(item.title) ===
            normalizeNewsTitle(articleImg.title) ||
          normalizeNewsTitle(item.title).includes(
            normalizeNewsTitle(articleImg.title),
          ) ||
          normalizeNewsTitle(articleImg.title).includes(
            normalizeNewsTitle(item.title),
          )),
    ) || null;

  const featured =
    matchedFeaturedNews ||
    (articleImg
      ? {
          title: articleImg.title,
          description: articleImg.description || newsData[0]?.description || "",
          date: newsData[0]?.date || "",
          author: newsData[0]?.author || "",
          url_path: articleImg.url,
        }
      : newsData[0]);

  const featuredImage = articleImg?.img || null;

  const rest = newsData.filter((item) =>
    featured
      ? normalizeNewsUrl(item.url_path) !== normalizeNewsUrl(featured.url_path)
      : true,
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
        <div className="group relative h-[366px] w-full overflow-hidden rounded-3xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)]">
          <div className="relative h-full w-full overflow-hidden">
            {featuredImage ? (
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-500 ease-in-out group-hover:scale-105 group-hover:brightness-110"
                style={{ backgroundImage: `url(${featuredImage})` }}
              />
            ) : (
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#252525,#111111)]" />
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,18,18,0.04)_0%,rgba(20,20,20,0.14)_42%,rgba(28,28,28,0.56)_68%,rgba(35,35,35,0.92)_86%,rgba(39,39,39,1)_100%)]" />
          </div>

          <div className="absolute right-6 top-1 z-10 md:right-7">
            <div className="inline-flex rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(23,23,23,0.72)] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
              Latest News
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-6 pt-24 md:px-7 md:pb-7">
            <h2 className="mb-3 max-w-3xl text-[28px] font-bold leading-[1.15] text-white md:text-[30px]">
              {featured?.title}
            </h2>

            <div className="mb-5 text-sm text-[rgba(214,220,226,0.72)]">
              {featured?.date} - {featured?.author}
            </div>
            <a
              href={featured?.url_path}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-base font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-80"
            >
              Read more -<span className="ml-1">{">"}</span>
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {rest.slice(0, 6).map((item, i) => (
            <article
              key={i}
              className="card transition hover:bg-[var(--color-bg-surface-elevated)]"
            >
              <div className="card-body">
                <h3 className="card-title mb-2">{item.title}</h3>
                <p className="body-text mb-2 line-clamp-3">
                  {item.description}
                </p>
                <div className="mb-4 text-xs text-[var(--color-text-muted)]">
                  {item.date} - {item.author}
                </div>
                <a
                  href={item.url_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-accent"
                >
                  Read more -<span className="ml-1">{">"}</span>
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
