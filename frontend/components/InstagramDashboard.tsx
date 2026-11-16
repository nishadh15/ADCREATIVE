import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Overview {
  username: string;
  name: string;
  followers_count: number;
  media_count: number;
  profile_picture_url?: string;
}

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
    <div className="flex items-center gap-3 border-[3px] border-ink bg-bone p-5 font-mono text-sm font-bold shadow-brutsm">
      <span className="h-3 w-3 animate-pulse bg-accent" />SYNCING LIVE INSTAGRAM ANALYTICS…
    </div>
  );
  if (error) return <div className="border-[3px] border-ink bg-peach p-5 font-mono text-sm font-bold shadow-brutsm">⚠ INSTAGRAM: {error}</div>;

  const stats = [
    ["Daily reach", insights?.reach?.[0]?.values?.slice(-1)[0]?.value ?? 0, "bg-accent"],
    ["Accounts engaged", insights?.engagement?.find((e: any) => e.name === 'accounts_engaged')?.total_value?.value ?? 0, "bg-lime"],
    ["Profile views", insights?.engagement?.find((e: any) => e.name === 'profile_views')?.total_value?.value ?? 0, "bg-bone"],
  ] as const;

  return (
    <div className="space-y-6">
      {overview && (
        <div className="flex flex-wrap items-center gap-5 border-[3px] border-ink bg-bone p-5 shadow-brut">
          {overview.profile_picture_url && (
            <img src={overview.profile_picture_url} alt={overview.username} className="h-20 w-20 border-[3px] border-ink object-cover shadow-brutsm" />
          )}
          <div>
            <span className="tag">Live · Meta Graph</span>
            <h2 className="mt-2 !text-3xl">{String(overview.name || overview.username).normalize("NFKC")}</h2>
            <p className="font-mono text-sm font-bold text-neutral-500">@{overview.username}</p>
          </div>
          <div className="ml-auto flex gap-8">
            {[["Followers", overview.followers_count], ["Posts", overview.media_count]].map(([l, v]) => (
              <div key={l as string}>
                <span className="block font-display text-5xl leading-none tabular-nums">{(v as number).toLocaleString("en-IN")}</span>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {insights && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {stats.map(([label, value, tone]) => (
            <div key={label} className={`brut-hover border-[3px] border-ink p-5 shadow-brut ${tone}`}>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em]">{label}</span>
              <p className="mt-2 font-display text-6xl leading-none tabular-nums">{Number(value).toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
