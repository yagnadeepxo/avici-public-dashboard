import { useEffect, useState } from "react";

interface WalletSwapStats {
  success: boolean;
  total_volume_usd: number;
  total_count: number;
  last_updated: string;
}

export const useWalletSwapStats = () => {
  const [data, setData] = useState<WalletSwapStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_PUBLIC_DASHBOARD_API_URL || 'https://avici-public-dashboard-production.up.railway.app'
        const res = await fetch(
          `${apiUrl}/api/wallet/swaps/summary`
        );
        if (!res.ok) throw new Error("Failed to fetch swap stats");
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
