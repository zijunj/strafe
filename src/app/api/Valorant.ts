import { useState, useEffect } from "react";
import axios from "axios";
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
        const encodedEndpoint = encodeURIComponent(url);
        const res = await axios.get(`/api/proxy?endpoint=${encodedEndpoint}`);
        const result = res.data;
        setData(parse ? parse(result) : result);
        localStorage.setItem(key, JSON.stringify(result));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (!cache) fetchData();
  }, [key, url]);

  return { data, loading };
}
