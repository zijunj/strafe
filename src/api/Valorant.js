import {useState, useEffect} from "react"
export default function useValorantApiWithCache({ key, url, parse }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!localStorage) return;

    let cache = {};
    if (localStorage.getItem(key)) {
      cache = JSON.parse(localStorage.getItem(key));
      setData(parse ? parse(cache[key]) : cache[key]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(url);
        const result = await res.json();

        cache[key] = result;
        setData(parse ? parse(result) : result);
        localStorage.setItem(key, JSON.stringify(cache));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [key, url]);

  return { data, loading };
}
