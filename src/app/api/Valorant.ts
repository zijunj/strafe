import { useState, useEffect } from "react";
import axios from "axios";

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
}: {
  key: string;
  url: string;
  parse?: (data: any) => T;
}) {
  const [data, setData] = useState<T>([] as T);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cache = localStorage.getItem(key);
    if (cache) {
      const parsed = JSON.parse(cache);
      setData(parse ? parse(parsed) : parsed);
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(getRequestUrl(url));
        const result = res.data;
        setData(parse ? parse(result) : result);
        localStorage.setItem(key, JSON.stringify(result));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, url]);

  return { data, loading };
}
