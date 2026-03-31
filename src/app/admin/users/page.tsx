"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  display_name: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  linkedin_url: string | null;
  role: string;
  membership_status: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user || profile?.role !== "Admin") {
        router.push("/");
      } else {
        fetchUsers();
      }
    }
  }, [user, profile, loading, router]);

  const fetchUsers = async () => {
    setFetching(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data as UserProfile[]);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async (userId: string, field: string, value: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value })
        .eq("id", userId);

      if (error) throw error;
      
      // Update local state optimizing a reload
      setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
    } catch (err: any) {
      alert("Error updating user: " + err.message);
    }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Laddar användare...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-brand-dark dark:text-white capitalize tracking-tight mb-2">Användarhantering</h1>
        <p className="text-gray-500 font-medium tracking-wide">Hantera roller, godkänn medlemsansökningar och visa kontaktuppgifter.</p>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-bold">{error}</div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Användare</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Organisation</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Kontakt</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Roll</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900 dark:text-white">{u.full_name || u.display_name}</span>
                        <span className="text-xs text-gray-500">Reg: {new Date(u.created_at).toLocaleDateString('sv-SE')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {u.company ? (
                        <div className="inline-block px-3 py-1 bg-brand-light dark:bg-slate-800 rounded-lg text-brand-teal font-black text-xs uppercase tracking-wider">{u.company}</div>
                      ) : (
                        <span className="text-gray-400 text-sm italic">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {u.phone && <span className="text-xs text-gray-600 dark:text-gray-400">📞 {u.phone}</span>}
                        {u.linkedin_url && (
                          <a href={u.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 font-bold hover:underline">
                            in/ Profil &rarr;
                          </a>
                        )}
                        {!u.phone && !u.linkedin_url && <span className="text-gray-400 text-sm italic">-</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={u.membership_status}
                        onChange={(e) => handleUpdate(u.id, "membership_status", e.target.value)}
                        className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border-none appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-brand-teal/20 ${
                          u.membership_status === "Approved" ? "bg-green-100 text-green-700" :
                          u.membership_status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        <option value="Approved">Approved</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={u.role}
                        onChange={(e) => handleUpdate(u.id, "role", e.target.value)}
                        className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-none appearance-none cursor-pointer outline-none hover:bg-gray-200 focus:ring-2 focus:ring-brand-teal/20"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                        <option value="Partner">Partner</option>
                        <option value="Investor">Investor</option>
                        <option value="Sales">Sales</option>
                        <option value="Regular">Regular</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">Inga användare hittades.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
