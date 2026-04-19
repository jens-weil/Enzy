"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchSettingsOnce } from '@/lib/settingsCache';

function AdminDashboard() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [company, setCompany] = useState({ name: "Enzymatica" });
  
  useEffect(() => {
    fetchSettingsOnce().then(data => {
      if (data?.company?.name) setCompany({ name: data.company.name });
    });
  }, []);
  
  // Redirect if not Admin, Editor or Redaktör
  useEffect(() => {
    if (!authLoading && (!user || (profile?.role !== 'Admin' && profile?.role !== 'Editor' && profile?.role !== 'Redaktör'))) {
      router.push('/');
    }
  }, [user, profile, authLoading, router]);

  if (!authLoading && (!user || (profile?.role !== 'Admin' && profile?.role !== 'Editor' && profile?.role !== 'Redaktör'))) {
    return null;
  }

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
      <div className="max-w-5xl mx-auto px-4 py-12 md:py-24">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h1 className="text-5xl font-black text-brand-dark dark:text-white mb-4 italic uppercase tracking-tight">
              Administration
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">
                {company.name} Portal Central Control
            </p>
          </div>
          <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="px-8 py-3 rounded-2xl bg-white dark:bg-slate-900 text-red-500 font-black text-[10px] uppercase tracking-widest border border-red-50 dark:border-red-900/20 hover:bg-red-50 transition-all shadow-sm"
          >
            Logga ut
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Users Card - Only for Admin */}
          {profile?.role === "Admin" && (
            <Link 
              href="/admin/users"
              className="group relative bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 hover:border-brand-teal transition-all hover:scale-[1.02] overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-full -mr-16 -mt-16 group-hover:bg-brand-teal/10 transition-colors" />
              <div className="relative z-10">
                <span className="text-4xl mb-6 block">👥</span>
                <h2 className="text-2xl font-black text-brand-dark dark:text-white uppercase italic mb-2 tracking-tight">
                  Användarhantering
                </h2>
                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                  Hantera portalens användare, godkänn medlemskap och ändra behörigheter.
                </p>
                <span className="inline-flex items-center gap-2 text-brand-teal font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                  Hantera användare <span>&rarr;</span>
                </span>
              </div>
            </Link>
          )}

          {/* Settings Card */}
          <Link 
            href="/admin/settings"
            className="group relative bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 hover:border-brand-teal transition-all hover:scale-[1.02] overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/5 rounded-full -mr-16 -mt-16 group-hover:bg-brand-teal/10 transition-colors" />
            <div className="relative z-10">
              <span className="text-4xl mb-6 block">⚙️</span>
              <h2 className="text-2xl font-black text-brand-dark dark:text-white uppercase italic mb-2 tracking-tight">
                Portalinställningar
              </h2>
              <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
                Konfigurera externa API:er, sociala medier och {profile?.role === "Admin" ? "marknadsinformation" : "kanaler"}.
              </p>
              <span className="inline-flex items-center gap-2 text-brand-teal font-black text-[10px] uppercase tracking-widest group-hover:gap-4 transition-all">
                Öppna inställningar <span>&rarr;</span>
              </span>
            </div>
          </Link>
          
          {/* Articles Redirect Info Card */}
          <div className="md:col-span-2 bg-brand-dark p-10 rounded-[3rem] relative overflow-hidden shadow-2xl mt-8">
             <div className="absolute inset-0 bg-gradient-to-r from-brand-teal/20 to-transparent opacity-50" />
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                   <h2 className="text-3xl font-black text-white uppercase italic mb-2 tracking-tight">
                      Nyhetshantering
                   </h2>
                   <p className="text-white/60 text-sm font-medium max-w-lg">
                      Artiklar och nyheter hanteras numera direkt via flödet på nyhetssidan för en smidigare upplevelse.
                   </p>
                </div>
                <Link 
                  href="/articles"
                  className="px-10 py-5 rounded-2xl bg-brand-teal text-white font-black text-xs uppercase tracking-widest hover:bg-white hover:text-brand-dark transition-all shadow-xl shadow-brand-teal/20"
                >
                  Till Nyheter &rarr;
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laddar...</div>}>
      <AdminDashboard />
    </Suspense>
  );
}
