// src/hooks/usePrices.ts
import { useEffect, useState } from "react";
import axios from "axios";

export default function usePrices() {
  const [prices, setPrices] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const response = await axios.get(
          "https://api.coingecko.com/api/v3/simple/price",
          {
            params: {
              ids: "bitcoin,ethereum,usd-coin",
              vs_currencies: "usd",
              include_24hr_change: "true"
            }
          }
        );
        setPrices(response.data);
      } catch (err) {
        console.error("Error fetching prices:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // refresh every 30 sec
    return () => clearInterval(interval);
  }, []);

  return { prices, loading };
}
