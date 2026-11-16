import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Overview {
  username: string;
  name: string;
  followers_count: number;
  media_count: number;
  profile_picture_url?: string;
}

const Shell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-[2rem] border border-white/10 bg-white/[0.03] p-1.5 ${className}`}>
    <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#0a0a0a]/80 shadow-core">{children}</div>
  </div>
);

export default function InstagramDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInstagramData() {
      try {
        setLoading(true);
        const [overviewData, insightsData] = await Promise.all([
          api('/api/instagram/overview'),
          api('/api/instagram/insights'),
        ]);

        setOverview(overviewData);
        setInsights(insightsData);
      } catch (err: any) {
        setError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    }

    fetchInstagramData();
  }, []);

  if (loading) return (
    <Shell><div className="flex items-center gap-3 p-6 text-sm text-neutral-400">
      <span className="h-2 w-2 animate-pulse rounded-full bg-accent shadow-glow" />Syncing live Instagram analytics…
    </div></Shell>
  );
  if (error) return <Shell><div className="p-6 text-sm text-red-300">Instagram: {error}</div></Shell>;

  const stats = [
    ["Daily Reach", insights?.reach?.[0]?.values?.slice(-1)[0]?.value ?? 0, "from-accent/20"],
    ["Accounts Engaged", insights?.engagement?.find((e: any) => e.name === 'accounts_engaged')?.total_value?.value ?? 0, "from-emerald-400/20"],
    ["Profile Views", insights?.engagement?.find((e: any) => e.name === 'profile_views')?.total_value?.value ?? 0, "from-violet/25"],
  ] as const;

  return (
    <div className="space-y-4">
      {overview && (
        <Shell>
          <div className="flex flex-wrap items-center gap-5 p-6">
            {overview.profile_picture_url && (
              <img src={overview.profile_picture_url} alt={overview.username}
                className="h-16 w-16 rounded-full object-cover ring-2 ring-accent/60 ring-offset-4 ring-offset-[#0a0a0a]" />
            )}
            <div>
              <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-emerald-300">Live · Meta Graph</span>
              <h1 className="mt-2 text-xl font-semibold tracking-tight">{overview.name}</h1>
              <p className="text-sm text-neutral-500">@{overview.username}</p>
            </div>
            <div className="ml-auto flex gap-8">
              {[["Followers", overview.followers_count], ["Posts", overview.media_count]].map(([l, v]) => (
                <div key={l as string}>
                  <span className="block text-3xl font-semibold tabular-nums tracking-tight">{(v as number).toLocaleString("en-IN")}</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </Shell>
      )}

      {insights && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {stats.map(([label, value, glow]) => (
            <Shell key={label} className="transition-transform duration-700 ease-fluid hover:-translate-y-0.5">
              <div className={`rounded-[calc(2rem-0.375rem)] bg-gradient-to-br ${glow} to-transparent p-6`}>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">{label}</span>
                <p className="mt-3 text-4xl font-semibold tabular-nums tracking-tight">{Number(value).toLocaleString("en-IN")}</p>
              </div>
            </Shell>
          ))}
        </div>
      )}
    </div>
  );
}
