"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area
} from "recharts";

// --- DEMO DATA ---
const SALES_DATA = [
  { month: 'Jan', actual: 45000, goal: 40000, conversion: 3.2 },
  { month: 'Feb', actual: 52000, goal: 45000, conversion: 3.5 },
  { month: 'Mar', actual: 48000, goal: 50000, conversion: 3.1 },
  { month: 'Apr', actual: 61000, goal: 55000, conversion: 4.2 },
  { month: 'May', actual: 55000, goal: 60000, conversion: 3.8 },
  { month: 'Jun', actual: 67000, goal: 65000, conversion: 4.5 },
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
  { id: 1, title: 'Enzymatica Logo Pack', format: 'ZIP/SVG', size: '4.2 MB', category: 'Brand' },
  { id: 2, title: 'ColdZyme Product Shots 2026', format: 'JPG/PNG', size: '128 MB', category: 'Product' },
  { id: 3, title: 'Social Media Ad Templates', format: 'FIG/PSD', size: '15 MB', category: 'Marketing' },
  { id: 4, title: 'Clinical Study Summaries', format: 'PDF', size: '2.1 MB', category: 'Education' },
];

const CALENDAR_EVENTS = [
  { date: 'May 12', event: 'ColdZyme Lemon Launch', type: 'Product' },
  { date: 'May 20', event: 'Q2 Strategic Review', type: 'Meeting' },
  { date: 'Jun 05', event: 'Summer Sales Campaign Starts', type: 'Campaign' },
  { date: 'Jun 15', event: 'Global Partnership Summit', type: 'Event' },
];

// --- COMPONENTS ---

export default function PartnerPortal() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== "Partner" && profile?.role !== "Admin") {
        router.replace("/");
        return;
      }

      setUser({ ...session.user, ...profile });
      setLoading(false);
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin" />
      </div>
    );
  }

  const SidebarItem = ({ id, icon, label }: { id: string, icon: string, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all border-r-4 ${
        activeTab === id 
        ? "bg-brand-teal/10 text-brand-teal border-brand-teal font-bold" 
        : "text-gray-500 border-transparent hover:bg-white/5 hover:text-gray-300"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="uppercase tracking-widest text-[11px] font-black">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0a0c10] flex text-white font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0f1218] border-r border-white/5 flex flex-col pt-10 sticky top-0 h-screen">
        <div className="px-8 mb-12">
          <Image src="/logo.png" alt="Enzy" width={40} height={40} className="mb-4 opacity-80" />
          <h1 className="text-lg font-black uppercase italic tracking-tighter text-brand-teal">Partner Portal</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">International Division</p>
        </div>

        <nav className="flex-grow">
          <SidebarItem id="dashboard" icon="📊" label="Dashboard" />
          <SidebarItem id="toolkit" icon="🧰" label="Media Toolkit" />
          <SidebarItem id="education" icon="🎓" label="Education Hub" />
          <SidebarItem id="collaboration" icon="🤝" label="Collaboration Hub" />
        </nav>

        <div className="p-8 border-t border-white/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-teal/20 border border-brand-teal/30 flex items-center justify-center font-black text-brand-teal">
              {user?.full_name?.charAt(0) || "P"}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight truncate w-32">{user?.full_name}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Partner Account</p>
            </div>
          </div>
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.replace("/"))}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-12 overflow-y-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">
              {activeTab === 'dashboard' && "Performance Overview"}
              {activeTab === 'toolkit' && "Marketing Media Toolkit"}
              {activeTab === 'education' && "Educational Hub"}
              {activeTab === 'collaboration' && "Collaboration Hub"}
            </h2>
            <p className="text-gray-500 font-medium tracking-wide">
              {activeTab === 'dashboard' && "Review your sales progression and quarterly targets."}
              {activeTab === 'toolkit' && "Access official brand assets and campaign materials."}
              {activeTab === 'education' && "Deep dive into ColdZyme science and sales playbooks."}
              {activeTab === 'collaboration' && "Direct line to your account manager and resource requests."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal mb-1">Current Quarter</p>
            <p className="text-xl font-bold italic">Q2 2026</p>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Total Sales", value: "$328,000", change: "+14.2%", positive: true },
                { label: "Avg. Conv. Rate", value: "3.72%", change: "+0.4%", positive: true },
                { label: "Market Reach", value: "840k", change: "-2.1%", positive: false },
              ].map((kpi, i) => (
                <div key={i} className="bg-[#0f1218] border border-white/5 p-8 rounded-[2rem] shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">{kpi.label}</p>
                  <div className="flex items-end justify-between">
                    <h3 className="text-3xl font-black italic">{kpi.value}</h3>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${kpi.positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-[#0f1218] border border-white/5 p-8 rounded-[2rem] shadow-xl">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-10">Sales Performance vs Target</h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={SALES_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                      <XAxis dataKey="month" stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1f26', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', textTransform: 'uppercase', fontWeight: 'bold' }} />
                      <Bar dataKey="actual" name="Actual Sales" fill="#00cbcb" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="goal" name="Goal" fill="#374151" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0f1218] border border-white/5 p-8 rounded-[2rem] shadow-xl">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-10">Weekly Traffic & Engagement</h4>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MARKET_DATA}>
                      <defs>
                        <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00cbcb" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#00cbcb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                      <XAxis dataKey="day" stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis stroke="#4b5563" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1f26', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="traffic" stroke="#00cbcb" fillOpacity={1} fill="url(#colorTraffic)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'toolkit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {MEDIA_ASSETS.map((asset) => (
              <div key={asset.id} className="bg-[#0f1218] border border-white/5 p-8 rounded-[2rem] hover:border-brand-teal/30 transition-all group shadow-xl">
                 <div className="w-12 h-12 rounded-xl bg-brand-teal/10 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                    {asset.format === 'PDF' ? '📄' : asset.format.includes('ZIP') ? '📦' : '🖼️'}
                 </div>
                 <h3 className="text-lg font-black italic mb-2 uppercase">{asset.title}</h3>
                 <div className="flex gap-4 text-[10px] font-bold text-gray-500 uppercase mb-8">
                    <span>{asset.format}</span>
                    <span className="text-brand-teal">•</span>
                    <span>{asset.size}</span>
                 </div>
                 <button className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-teal hover:text-white hover:border-brand-teal transition-all">
                    Download Asset
                 </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-gradient-to-br from-brand-teal/20 to-transparent border border-white/10 p-10 rounded-[3rem] shadow-2xl">
                   <span className="px-3 py-1 rounded-full bg-brand-teal text-white text-[9px] font-black uppercase tracking-widest mb-6 inline-block">Featured Training</span>
                   <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">The Science of ColdZyme®</h3>
                   <p className="text-gray-400 font-medium mb-8 leading-relaxed">
                     A comprehensive deep dive into the barrier technology. Learn how to explain the mechanism of action to both pharmacists and consumers.
                   </p>
                   <button className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-teal hover:text-white transition-all">
                     Start Training Module
                   </button>
                </div>
                
                <div className="space-y-4">
                  {[
                    "Effective OTC Pitching Techniques",
                    "Understanding Common Cold Viruses",
                    "ColdZyme Clinical Study Findings (Key Takeaways)",
                    "Handling Competitive Product Inquiries"
                  ].map((title, i) => (
                    <div key={i} className="bg-[#0f1218] border border-white/5 p-6 rounded-2xl hover:bg-white/5 transition-all cursor-pointer flex justify-between items-center group shadow-md">
                       <span className="text-xs font-black uppercase tracking-widest text-gray-300 group-hover:text-brand-teal transition-colors">{title}</span>
                       <span className="text-gray-600 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'collaboration' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Chat Module */}
            <div className="lg:col-span-2 bg-[#0f1218] border border-white/5 rounded-[3rem] shadow-2xl flex flex-col h-[600px] overflow-hidden">
               <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/2">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-full border-2 border-brand-teal p-0.5">
                        <div className="w-full h-full rounded-full bg-brand-teal/20 flex items-center justify-center font-black">AM</div>
                     </div>
                     <div>
                        <p className="text-sm font-black uppercase tracking-widest">Global Support Team</p>
                        <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online
                        </p>
                     </div>
                  </div>
               </div>

               <div className="flex-grow p-8 overflow-y-auto space-y-6">
                  <div className="flex gap-4 max-w-lg">
                     <div className="w-8 h-8 rounded-lg bg-brand-teal/20 flex-shrink-0 flex items-center justify-center text-xs">🤖</div>
                     <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5">
                        <p className="text-xs font-medium leading-relaxed">
                          Hello! Welcome to the International Collaboration Hub. I'm your dedicated account manager. How can I assist you today with your Q2 targets?
                        </p>
                        <p className="text-[9px] text-gray-500 font-bold uppercase mt-2">10:45 AM</p>
                     </div>
                  </div>
               </div>

               <div className="p-8 border-t border-white/5 bg-white/2">
                  <div className="relative">
                     <input 
                       disabled
                       placeholder="Type your message to the account manager..." 
                       className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-medium focus:border-brand-teal transition-all outline-none pr-32"
                     />
                     <button disabled className="absolute right-2 top-2 bottom-2 px-6 bg-brand-teal/20 text-brand-teal rounded-xl text-[10px] font-black uppercase tracking-widest opacity-50">
                        Send
                     </button>
                  </div>
                  <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-4 text-center">Messaging is restricted to verified partner accounts</p>
               </div>
            </div>

            {/* Sidebar Tools */}
            <div className="space-y-6">
              <div className="bg-brand-teal border border-brand-teal/20 p-8 rounded-[3rem] shadow-2xl shadow-brand-teal/20">
                 <h4 className="text-lg font-black italic uppercase text-white mb-4">Request Resources</h4>
                 <p className="text-white/70 text-xs font-medium mb-8 leading-relaxed">
                   Need physical brochures, product samples, or professional consulting? Submit a fast request.
                 </p>
                 <button className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-transform shadow-lg">
                   Open Request Form
                 </button>
              </div>

              <div className="bg-[#0f1218] border border-white/5 p-8 rounded-[3rem] shadow-xl">
                 <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 underline decoration-brand-teal underline-offset-8">Launch Calendar</h4>
                 <div className="space-y-6">
                    {CALENDAR_EVENTS.map((item, i) => (
                      <div key={i} className="flex gap-4 items-start">
                         <div className="flex-shrink-0 w-12 text-center">
                            <p className="text-brand-teal font-black text-xs leading-none">{item.date.split(' ')[0]}</p>
                            <p className="text-lg font-black italic leading-none mt-1">{item.date.split(' ')[1]}</p>
                         </div>
                         <div>
                            <p className="text-xs font-black uppercase tracking-tight">{item.event}</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{item.type}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
