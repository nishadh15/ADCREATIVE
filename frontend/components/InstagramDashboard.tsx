import React, { useEffect, useState } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://adcreative-back.onrender.com';

interface Overview {
  username: string;
  name: string;
  followers_count: number;
  media_count: number;
  profile_picture_url?: string;
}

interface Post {
  id: string;
  caption?: string;
  permalink: string;
  like_count?: number;
  comments_count?: number;
  timestamp: string;
}

export default function InstagramDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInstagramData() {
      try {
        setLoading(true);
        const [overviewRes, insightsRes, postsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/instagram/overview`),
          fetch(`${BACKEND_URL}/api/instagram/insights`),
          fetch(`${BACKEND_URL}/api/instagram/posts`)
        ]);

        if (!overviewRes.ok || !insightsRes.ok || !postsRes.ok) {
          throw new Error('Failed to load Instagram analytics');
        }

        const overviewData = await overviewRes.json();
        const insightsData = await insightsRes.json();
        const postsData = await postsRes.json();

        setOverview(overviewData);
        setInsights(insightsData);
        setPosts(postsData.data || []);
      } catch (err: any) {
        setError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    }

    fetchInstagramData();
  }, []);

  if (loading) return <div className="p-6 text-center text-gray-500">Loading Instagram Analytics...</div>;
  if (error) return <div className="p-6 text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {overview && (
        <div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          {overview.profile_picture_url && (
            <img
              src={overview.profile_picture_url}
              alt={overview.username}
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
            />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{overview.name}</h1>
            <p className="text-gray-500">@{overview.username}</p>
          </div>
          <div className="ml-auto flex gap-6">
            <div className="text-center">
              <span className="block text-2xl font-bold text-gray-900">{overview.followers_count}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Followers</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-gray-900">{overview.media_count}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">Posts</span>
            </div>
          </div>
        </div>
      )}

      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-indigo-50 rounded-xl border border-indigo-100">
            <span className="text-sm font-medium text-indigo-600">Daily Reach</span>
            <p className="text-3xl font-extrabold text-indigo-900 mt-2">
              {insights.reach?.[0]?.values?.slice(-1)[0]?.value ?? 0}
            </p>
          </div>
          <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
            <span className="text-sm font-medium text-emerald-600">Accounts Engaged</span>
            <p className="text-3xl font-extrabold text-emerald-900 mt-2">
              {insights.engagement?.find((e: any) => e.name === 'accounts_engaged')?.total_value?.value ?? 0}
            </p>
          </div>
          <div className="p-5 bg-purple-50 rounded-xl border border-purple-100">
            <span className="text-sm font-medium text-purple-600">Profile Views</span>
            <p className="text-3xl font-extrabold text-purple-900 mt-2">
              {insights.engagement?.find((e: any) => e.name === 'profile_views')?.total_value?.value ?? 0}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800">Recent Posts Performance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center text-sm font-semibold text-gray-700 mb-2">
                <span>❤️ {post.like_count ?? 0}</span>
                <span>💬 {post.comments_count ?? 0}</span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2">
                {post.caption || 'No caption provided.'}
              </p>
              <span className="text-[10px] text-gray-400 mt-3 block">
                {new Date(post.timestamp).toLocaleDateString()}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}