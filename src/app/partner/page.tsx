"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from "recharts";

const SALES_DATA = [
  { month: 'Jan', actual: 45000, goal: 40000 },
  { month: 'Feb', actual: 52000, goal: 45000 },
  { month: 'Mar', actual: 48000, goal: 50000 },
  { month: 'Apr', actual: 61000, goal: 55000 },
  { month: 'May', actual: 55000, goal: 60000 },
  { month: 'Jun', actual: 67000, goal: 65000 },
];

const MARKET_DATA = [
  { day: 'Mon', traffic: 1200 },
  { day: 'Tue', traffic: 1900 },
  { day: 'Wed', traffic: 1500 },
  { day: 'Thu', traffic: 2100 },
  { day: 'Fri', traffic: 2400 },
  { day: 'Sat', traffic: 1800 },
  { day: 'Sun', traffic: 1400 },
];

const MEDIA_ASSETS = [
  { id: 1, title: 'Enzymatica Logo Pack', format: 'ZIP/SVG', size: '4.2 MB' },
  { id: 2, title: 'ColdZyme Product Shots 2026', format: 'JPG/PNG', size: '128 MB' },
  { id: 3, title: 'Social Media Ad Templates', format: 'FIG/PSD', size: '15 MB' },
  { id: 4, title: 'Clinical Study Summaries', format: 'PDF', size: '2.1 MB' },
];

const CALENDAR_EVENTS = [
  { date: 'May 12', event: 'ColdZyme Lemon Launch', type: 'Product' },
  { date: 'May 20', event: 'Q2 Strategic Review', type: 'Meeting' },
  { date: 'Jun 05', event: 'Summer Sales Campaign Starts', type: 'Campaign' },
  { date: 'Jun 15', event: 'Global Partnership Summit', type: 'Event' },
];

export default function PartnerPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/"); return; }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile?.role !== "Partner" && profile?.role !== "Admin") { router.replace("/"); return; }
      setUser({ ...session.user, ...profile });
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-61px)] bg-[#0a0c10] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin" />
      </div>
    );
  }

  const SidebarItem = ({ id, icon, label }: { id: string; icon: string; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-4 px-6 py-3.5 transition-all border-r-4 ${
        activeTab === id
          ? "bg-brand-teal/10 text-brand-teal border-brand-teal font-bold"
          : "text-gray-400 border-transparent hover:bg-white/5 hover:text-gray-200"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="uppercase tracking-widest text-[11px] font-black">{label}</span>
    </button>
  );

  return (
    /* Outer shell — locked to viewport, no scroll */
    <div className="h-[calc(100vh-61px)] flex overflow-hidden bg-[#0a0c10] text-white font-sans">

      {/* ── Sidebar ── */}
      <aside className="w-64 bg-[#1a2030] border-r border-white/5 flex flex-col flex-shrink-0">
        <div className="px-6 py-6 border-b border-white/5">
          <h1 className="text-base font-black uppercase italic tracking-tighter text-brand-teal">Partner Portal</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">International Division</p>
        </div>

        <nav className="flex-grow py-2">
          <SidebarItem id="dashboard" icon="📊" label="Dashboard" />
          <SidebarItem id="toolkit" icon="🧰" label="Media Toolkit" />
          <SidebarItem id="education" icon="🎓" label="Education Hub" />
          <SidebarItem id="collaboration" icon="🤝" label="Collaboration Hub" />
        </nav>

        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-brand-teal/20 border border-brand-teal/30 flex items-center justify-center font-black text-brand-teal text-sm flex-shrink-0">
              {user?.full_name?.charAt(0) || "P"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-tight truncate text-white">{user?.full_name}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Partner Account</p>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.replace("/"))}
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── flex column so header + content fill height */}
      <main className="flex-grow flex flex-col overflow-hidden">

        {/* Page Header — fixed height, never scrolls */}
        <header className="flex-shrink-0 px-8 py-5 border-b border-white/5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none">
              {activeTab === 'dashboard' && "Performance Overview"}
              {activeTab === 'toolkit' && "Marketing Media Toolkit"}
              {activeTab === 'education' && "Educational Hub"}
              {activeTab === 'collaboration' && "Collaboration Hub"}
            </h2>
            <p className="text-gray-400 font-medium text-xs mt-1">
              {activeTab === 'dashboard' && "Review your sales progression and quarterly targets."}
              {activeTab === 'toolkit' && "Access official brand assets and campaign materials."}
              {activeTab === 'education' && "Deep dive into ColdZyme science and sales playbooks."}
              {activeTab === 'collaboration' && "Direct line to your account manager and resource requests."}
            </p>
          </div>
          <div className="text-right flex-shrink-0 ml-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal">Current Quarter</p>
            <p className="text-lg font-bold italic text-white">Q2 2026</p>
          </div>
        </header>

        {/* Tab Content — fills all remaining height */}
        <div className="flex-1 min-h-0 overflow-hidden">

          {/* ── Dashboard ── */}
          {activeTab === 'dashboard' && (
            <div className="h-full flex flex-col gap-4 p-6 animate-in fade-in duration-300">
              {/* KPI Cards — fixed height row */}
              <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                {[
                  { label: "Total Sales", value: "$328,000", change: "+14.2%", positive: true },
                  { label: "Avg. Conv. Rate", value: "3.72%", change: "+0.4%", positive: true },
                  { label: "Market Reach", value: "840k", change: "-2.1%", positive: false },
                ].map((kpi, i) => (
                  <div key={i} className="bg-[#1a2030] border border-white/5 px-6 py-5 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{kpi.label}</p>
                    <div className="flex items-end justify-between">
                      <h3 className="text-2xl font-black italic text-white">{kpi.value}</h3>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${kpi.positive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {kpi.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts — fill remaining height */}
              <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                <div className="bg-[#1a2030] border border-white/5 p-6 rounded-2xl flex flex-col min-h-0">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex-shrink-0">Sales Performance vs Target</h4>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={SALES_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a2030', border: '1px solid #ffffff15', borderRadius: '10px', fontSize: '11px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', textTransform: 'uppercase', fontWeight: 'bold', color: '#9ca3af' }} />
                        <Bar dataKey="actual" name="Actual" fill="#00cbcb" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="goal" name="Goal" fill="#374151" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#1a2030] border border-white/5 p-6 rounded-2xl flex flex-col min-h-0">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex-shrink-0">Weekly Traffic & Engagement</h4>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={MARKET_DATA}>
                        <defs>
                          <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00cbcb" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00cbcb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                        <XAxis dataKey="day" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a2030', border: '1px solid #ffffff15', borderRadius: '10px', fontSize: '11px', color: '#fff' }} />
                        <Area type="monotone" dataKey="traffic" stroke="#00cbcb" fillOpacity={1} fill="url(#colorTraffic)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Media Toolkit ── */}
          {activeTab === 'toolkit' && (
            <div className="h-full overflow-y-auto p-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {MEDIA_ASSETS.map((asset) => (
                  <div key={asset.id} className="bg-[#1a2030] border border-white/5 p-6 rounded-2xl hover:border-brand-teal/30 transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-brand-teal/10 flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
                      {asset.format === 'PDF' ? '📄' : asset.format.includes('ZIP') ? '📦' : '🖼️'}
                    </div>
                    <h3 className="text-sm font-black italic mb-1 uppercase text-white">{asset.title}</h3>
                    <div className="flex gap-3 text-[10px] font-bold text-gray-400 uppercase mb-5">
                      <span>{asset.format}</span>
                      <span className="text-brand-teal">•</span>
                      <span>{asset.size}</span>
                    </div>
                    <button className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300 hover:bg-brand-teal hover:text-white hover:border-brand-teal transition-all">
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Education Hub ── */}
          {activeTab === 'education' && (
            <div className="h-full flex gap-6 p-6 animate-in fade-in duration-300 min-h-0">
              <div className="flex-1 bg-gradient-to-br from-brand-teal/20 to-transparent border border-white/10 p-8 rounded-2xl flex flex-col">
                <span className="px-3 py-1 rounded-full bg-brand-teal text-white text-[9px] font-black uppercase tracking-widest mb-5 inline-block w-fit">Featured Training</span>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-3 text-white">The Science of ColdZyme®</h3>
                <p className="text-gray-300 font-medium mb-6 leading-relaxed text-sm flex-grow">
                  A comprehensive deep dive into the barrier technology. Learn how to explain the mechanism of action to both pharmacists and consumers across international markets.
                </p>
                <button className="px-6 py-3.5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-teal hover:text-white transition-all w-fit">
                  Start Training Module
                </button>
              </div>

              <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                {[
                  "Effective OTC Pitching Techniques",
                  "Understanding Common Cold Viruses",
                  "ColdZyme Clinical Study Findings (Key Takeaways)",
                  "Handling Competitive Product Inquiries",
                  "Digital Marketing for Health Products",
                  "Pharmacy Staff Training Program"
                ].map((title, i) => (
                  <div key={i} className="bg-[#1a2030] border border-white/5 p-5 rounded-2xl hover:bg-white/5 transition-all cursor-pointer flex justify-between items-center group flex-shrink-0">
                    <span className="text-xs font-black uppercase tracking-widest text-gray-300 group-hover:text-brand-teal transition-colors">{title}</span>
                    <span className="text-gray-500 group-hover:translate-x-1 transition-transform ml-4">→</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Collaboration Hub ── */}
          {activeTab === 'collaboration' && (
            <div className="h-full flex gap-6 p-6 animate-in fade-in duration-300 min-h-0">
              {/* Chat — fills height */}
              <div className="flex-grow bg-[#1a2030] border border-white/5 rounded-2xl flex flex-col overflow-hidden min-h-0">
                <div className="p-5 border-b border-white/5 flex items-center gap-4 flex-shrink-0">
                  <div className="w-9 h-9 rounded-full border-2 border-brand-teal flex-shrink-0 flex items-center justify-center font-black text-brand-teal text-xs bg-brand-teal/10">AM</div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-white">Global Support Team</p>
                    <p className="text-[10px] text-green-400 font-bold uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online
                    </p>
                  </div>
                </div>

                <div className="flex-grow p-6 overflow-y-auto">
                  <div className="flex gap-3 max-w-xl">
                    <div className="w-7 h-7 rounded-lg bg-brand-teal/20 flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/10">
                      <p className="text-xs font-medium leading-relaxed text-gray-200">
                        Hello! Welcome to the International Collaboration Hub. I'm your dedicated account manager. How can I assist you today?
                      </p>
                      <p className="text-[9px] text-gray-500 font-bold uppercase mt-2">10:45 AM</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-white/5 flex-shrink-0">
                  <div className="relative">
                    <input
                      disabled
                      placeholder="Type your message..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium text-gray-300 placeholder:text-gray-600 outline-none pr-20"
                    />
                    <button disabled className="absolute right-2 top-2 bottom-2 px-4 bg-brand-teal/20 text-brand-teal rounded-xl text-[10px] font-black uppercase opacity-50">
                      Send
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-2 text-center">Messaging restricted to verified partners</p>
                </div>
              </div>

              {/* Right column — fixed width, scrollable */}
              <div className="w-72 flex-shrink-0 flex flex-col gap-4 overflow-y-auto">
                <div className="bg-brand-teal p-6 rounded-2xl shadow-xl shadow-brand-teal/20">
                  <h4 className="text-base font-black italic uppercase text-white mb-3">Request Resources</h4>
                  <p className="text-white/80 text-xs font-medium mb-5 leading-relaxed">
                    Need brochures, product samples, or consulting? Submit a fast request.
                  </p>
                  <button className="w-full py-3 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform">
                    Open Request Form
                  </button>
                </div>

                <div className="bg-[#1a2030] border border-white/5 p-6 rounded-2xl flex-grow">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-5 underline decoration-brand-teal underline-offset-8">Launch Calendar</h4>
                  <div className="space-y-5">
                    {CALENDAR_EVENTS.map((item, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-10 text-center">
                          <p className="text-brand-teal font-black text-[10px] leading-none">{item.date.split(' ')[0]}</p>
                          <p className="text-base font-black italic leading-none mt-1 text-white">{item.date.split(' ')[1]}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-tight text-gray-200">{item.event}</p>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{item.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
