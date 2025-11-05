import { useEffect, useState } from "react";

interface WalletTransactionStats {
  success: boolean;
  total_volume_usd: number;
  total_count: number;
  last_updated: string;
}

export const useWalletTransactionStats = () => {
  const [data, setData] = useState<WalletTransactionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(
          "https://avici-public-dashboard-production.up.railway.app/api/wallet/transactions/summary"
        );
        if (!res.ok) throw new Error("Failed to fetch transaction stats");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { data, loading, error };
};
