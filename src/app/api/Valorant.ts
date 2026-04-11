import { useState, useEffect, useRef } from "react";
import axios from "axios";

interface CachedPayload<T> {
  cachedAt: number;
  data: T;
}

function getRequestUrl(url: string) {
  if (url.startsWith("/api/")) {
    return url;
  }

  if (url.startsWith("storage/")) {
    return `/api/${url}`;
  }

  const encodedEndpoint = encodeURIComponent(url);
  return `/api/proxy?endpoint=${encodedEndpoint}`;
}

export default function useValorantApiWithCache<T>({
  key,
  url,
  parse,
  enabled = true,
  cacheTtlMs,
  useCache = true,
}: {
  key: string;
  url: string;
  parse?: (data: any) => T;
  enabled?: boolean;
  cacheTtlMs?: number;
  useCache?: boolean;
}) {
  const [data, setData] = useState<T>([] as T);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const parseRef = useRef(parse);

  useEffect(() => {
    parseRef.current = parse;
  }, [parse]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const cache = useCache ? localStorage.getItem(key) : null;
    if (cache) {
      try {
        const parsedCache = JSON.parse(cache) as
          | CachedPayload<unknown>
          | unknown;
        const hasWrappedCache =
          typeof parsedCache === "object" &&
          parsedCache !== null &&
          "cachedAt" in parsedCache &&
          "data" in parsedCache;
        const cacheIsFresh =
          !cacheTtlMs ||
          !hasWrappedCache ||
          Date.now() - Number((parsedCache as CachedPayload<unknown>).cachedAt) <
            cacheTtlMs;

        if (cacheIsFresh) {
          const cachedValue = hasWrappedCache
            ? (parsedCache as CachedPayload<unknown>).data
            : parsedCache;
          setData(
            parseRef.current
              ? parseRef.current(cachedValue)
              : (cachedValue as T),
          );
        } else {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(getRequestUrl(url));
        const result = res.data;
        setData(
          parseRef.current ? parseRef.current(result) : (result as T),
        );
        if (useCache) {
          localStorage.setItem(
            key,
            JSON.stringify({
              cachedAt: Date.now(),
              data: result,
            } satisfies CachedPayload<unknown>),
          );
        } else {
          localStorage.removeItem(key);
        }
      } catch (err) {
        setError(err);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cacheTtlMs, enabled, key, url, useCache]);

  return { data, loading, error };
}
