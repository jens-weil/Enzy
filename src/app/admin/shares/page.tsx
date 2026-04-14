"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

interface ShareProfile {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  article_id: string;
  platform: string;
  share_url: string;
  is_approved: boolean | null;
  created_at: string;
  updated_at: string;
}

export default function AdminSharesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin mb-4" />
        <p className="font-black text-brand-teal uppercase tracking-widest animate-pulse">Laddar admin verktyg...</p>
      </div>
    }>
      <AdminSharesContent />
    </Suspense>
  );
}

function AdminSharesContent() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("userId");
  
  const [shares, setShares] = useState<ShareProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  // Verification Iframe Modal
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingShare, setVerifyingShare] = useState<ShareProfile | null>(null);

  // Action Menu Dropdown state (row specific)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  // Bulk actions Dropdown
  const [showBulkActionDropdown, setShowBulkActionDropdown] = useState(false);

  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(initialUserId);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ShareProfile | 'name', direction: 'asc' | 'desc' | null }>({ key: 'created_at', direction: 'desc' });

  const fetchShares = async () => {
    setFetching(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/shares", {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch shares");
      }
      
      const data = await res.json();
      setShares(data);
    } catch (err: any) {
      setError(err.message || "Failed to load shares");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (profile?.role !== "Admin") {
        router.push("/");
      } else {
        fetchShares();
      }
    }
  }, [profile, authLoading, router]);

  // Derived filtered & sorted shares
  const currentShares = useMemo(() => {
    let result = [...shares];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.user_name?.toLowerCase().includes(q) || 
        s.user_email?.toLowerCase().includes(q) ||
        s.article_id?.toLowerCase().includes(q)
      );
    }

    if (platformFilter !== "All") {
      result = result.filter(s => s.platform.toLowerCase() === platformFilter.toLowerCase());
    }

    if (statusFilter !== "All") {
      if (statusFilter === "Approved") result = result.filter(s => s.is_approved === true);
      if (statusFilter === "Rejected") result = result.filter(s => s.is_approved === false);
      if (statusFilter === "Pending") result = result.filter(s => s.is_approved === null);
    }

    if (selectedUserFilter) {
      result = result.filter(s => s.user_id === selectedUserFilter);
    }

    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof ShareProfile];
        let bValue: any = b[sortConfig.key as keyof ShareProfile];

        if (sortConfig.key === 'name') {
          aValue = a.user_name?.toLowerCase();
          bValue = b.user_name?.toLowerCase();
        } else {
          aValue = aValue?.toString().toLowerCase() || "";
          bValue = bValue?.toString().toLowerCase() || "";
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [shares, searchQuery, platformFilter, statusFilter, selectedUserFilter, sortConfig]);

  const toggleSelectAll = () => {
    if (selectedIds.size === currentShares.length && currentShares.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentShares.map(s => s.id)));
    }
  };

  const toggleSelectShare = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const requestSort = (key: keyof ShareProfile | 'name') => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key, direction });
  };

  const updateShareStatus = async (id: string, is_approved: boolean | null) => {
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/shares", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id, is_approved })
      });

      if (!res.ok) throw new Error("Update failed");
      await fetchShares();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkStatusUpdate = async (is_approved: boolean | null) => {
    const actionText = is_approved === true ? "godkänna" : is_approved === false ? "neka" : "återställa validering";
    if (!confirm(`Vill du verkligen ${actionText} ${selectedIds.size} delningar?`)) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const promises = Array.from(selectedIds).map(id => 
        fetch("/api/admin/shares", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ id, is_approved })
        })
      );

      await Promise.all(promises);
      await fetchShares();
      setSelectedIds(new Set());
    } catch (err: any) {
      alert("Fel vid bulk-uppdatering: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`VARNING: Vill du verkligen RADERA ${selectedIds.size} delningar permanent?`)) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const promises = Array.from(selectedIds).map(id => 
        fetch(`/api/admin/shares?id=${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${session?.access_token}`
          }
        })
      );

      await Promise.all(promises);
      await fetchShares();
      setSelectedIds(new Set());
    } catch (err: any) {
      alert("Fel vid radering: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openVerifyModal = (share: ShareProfile) => {
    setVerifyingShare(share);
    setShowVerifyModal(true);
    setActiveDropdown(null);
  };

  const handleVerifySubmit = async (is_approved: boolean) => {
    if (!verifyingShare) return;
    await updateShareStatus(verifyingShare.id, is_approved);
    setShowVerifyModal(false);
    setVerifyingShare(null);
  };

  if (authLoading || (fetching && shares.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin mb-4" />
        <p className="font-black text-brand-teal uppercase tracking-widest animate-pulse">Laddar delningar...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-light dark:bg-slate-900 border border-brand-teal/20 text-brand-teal text-[10px] font-black uppercase tracking-widest italic">
            <span className="w-2 h-2 rounded-full bg-brand-teal" />
            Admin Panel
          </div>
          <h1 className="text-5xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter">
            {selectedUserFilter ? "Användarens Delningar" : "Alla Delningar"}
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-xl">
            Verifiera delningar för att tilldela poäng. Godkända delningar = 1 poäng per styck.
          </p>
        </div>
        {selectedUserFilter && (
           <button 
             onClick={() => { setSelectedUserFilter(null); router.replace("/admin/shares"); }}
             className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 font-black text-xs uppercase tracking-widest transition-colors flex items-center gap-2"
           >
             ✖ Rensa användarfilter
           </button>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-[1.25rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-visible">
        
        {/* Actions Row */}
        <div className="px-6 py-3 md:px-8 flex flex-col md:flex-row gap-4 border-b border-gray-50 dark:border-slate-800/50">
          <div className="flex-1 relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl grayscale opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
            <input 
              type="text" 
              placeholder="Sök användare, e-post eller artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-bold text-sm dark:text-white transition-all"
            />
          </div>
          <div className="flex gap-4">
             <select 
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-6 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-black text-[10px] uppercase tracking-widest dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all font-sans"
            >
              <option value="All">Alla Plattfomar</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Facebook">Facebook</option>
              <option value="TikTok">TikTok</option>
              <option value="X">X (Twitter)</option>
              <option value="Instagram">Instagram</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-6 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-black text-[10px] uppercase tracking-widest dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all font-sans"
            >
              <option value="All">Alla Statusar</option>
              <option value="Pending">Väntar (Obehandlad)</option>
              <option value="Approved">Godkända</option>
              <option value="Rejected">Nekade</option>
            </select>
          </div>
        </div>

        {/* Dynamic Contextual Toolbox */}
        {selectedIds.size > 0 && (
          <div className="px-6 md:px-8 py-3 bg-brand-dark/5 dark:bg-brand-teal/5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300 border-b border-gray-50 dark:border-slate-800/50">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-teal flex items-center justify-center text-white font-black text-xs">
                  {selectedIds.size}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark dark:text-white">Markerade</span>
              </div>
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-teal transition-colors"
              >
                Rensa val
              </button>
            </div>

            <div className="relative">
              {showBulkActionDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setShowBulkActionDropdown(false)} />
              )}
              <button 
                onClick={() => setShowBulkActionDropdown(!showBulkActionDropdown)}
                className="px-5 py-2.5 rounded-xl bg-brand-teal/10 hover:bg-brand-teal border border-brand-teal/20 text-brand-teal hover:text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 relative z-50"
              >
                Bulk åtgärder
                <span className={`text-[8px] transition-transform ${showBulkActionDropdown ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {showBulkActionDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95">
                  <button 
                    onClick={() => { handleBulkStatusUpdate(true); setShowBulkActionDropdown(false); }}
                    className="w-full text-left px-5 py-3 hover:bg-green-50 dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-green-600 transition-colors"
                  >
                    ✅ Godkänn
                  </button>
                  <button 
                    onClick={() => { handleBulkStatusUpdate(false); setShowBulkActionDropdown(false); }}
                    className="w-full text-left px-5 py-3 hover:bg-orange-50 dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-orange-600 transition-colors"
                  >
                    ❌ Neka
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-slate-800 my-1"></div>
                  <button 
                    onClick={() => { handleBulkDelete(); setShowBulkActionDropdown(false); }}
                    className="w-full text-left px-5 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-[10px] font-black uppercase tracking-widest text-red-600 transition-colors"
                  >
                    🗑️ Radera
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data List */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-800">
                <th className="px-6 py-3 w-10">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size === currentShares.length && currentShares.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 rounded border-2 border-gray-200 dark:border-slate-700 text-brand-teal focus:ring-brand-teal transition-all cursor-pointer"
                    />
                  </div>
                </th>
                <th onClick={() => requestSort('name')} className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-teal transition-colors">
                  Användare {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => requestSort('article_id')} className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-teal transition-colors hidden md:table-cell">
                  Artikel / URL {sortConfig.key === 'article_id' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => requestSort('platform')} className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-teal transition-colors">
                  Platform {sortConfig.key === 'platform' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => requestSort('is_approved')} className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-teal transition-colors">
                  Status {sortConfig.key === 'is_approved' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => requestSort('created_at')} className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-teal transition-colors hidden lg:table-cell">
                  Skapad {sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {currentShares.map(share => (
                <tr key={share.id} className={`group transition-all duration-300 ${selectedIds.has(share.id) ? "bg-brand-teal/5 dark:bg-brand-teal/5" : "hover:bg-gray-50/50 dark:hover:bg-slate-800/50"}`}>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(share.id)}
                        onChange={() => toggleSelectShare(share.id)}
                        className={`w-5 h-5 rounded border-2 transition-all cursor-pointer ${selectedIds.has(share.id) ? "border-brand-teal bg-brand-teal text-white" : "border-gray-200 dark:border-slate-700 text-brand-teal focus:ring-brand-teal"}`}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col">
                      <span className="font-black text-brand-dark dark:text-white text-xs">{share.user_name}</span>
                      <span className="text-[9px] font-bold text-gray-400">{share.user_email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell max-w-[200px] truncate">
                     <div className="flex flex-col">
                       <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{share.article_id}</span>
                       {share.share_url ? (
                         <a href={share.share_url} target="_blank" rel="noreferrer" className="text-[10px] text-brand-teal hover:underline truncate inline-block">🔗 {share.share_url}</a>
                       ) : (
                         <span className="text-[10px] text-gray-400 italic">Länk saknas</span>
                       )}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">
                       {share.platform}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                       share.is_approved === true ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                       share.is_approved === false ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                       "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                     }`}>
                       {share.is_approved === true ? "Godkänd (1p)" : share.is_approved === false ? "Nekad" : "Väntar"}
                     </span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                     <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {new Date(share.created_at).toLocaleDateString('sv-SE')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                     {/* Action Dropdown per row */}
                     <button
                       onClick={() => setActiveDropdown(activeDropdown === share.id ? null : share.id)}
                       className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 transition-colors"
                     >
                       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                       </svg>
                     </button>

                     {activeDropdown === share.id && (
                       <>
                         <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                         <div className="absolute right-8 top-10 mt-1 w-40 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-2xl z-40 py-2 animate-in fade-in zoom-in-95 text-left">
                           {share.is_approved === null && (
                             <button
                               onClick={() => openVerifyModal(share)}
                               disabled={!share.share_url}
                               className="w-full text-left px-4 py-3 hover:bg-brand-light dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-brand-teal transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                             >
                               👁️ Verifiera
                             </button>
                           )}
                           <button
                             onClick={() => { updateShareStatus(share.id, true); setActiveDropdown(null); }}
                             className="w-full text-left px-4 py-3 hover:bg-green-50 dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-green-600 transition-colors"
                           >
                             ✅ Godkänn
                           </button>
                           <button
                             onClick={() => { updateShareStatus(share.id, false); setActiveDropdown(null); }}
                             className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-orange-600 transition-colors"
                           >
                             ❌ Neka
                           </button>
                           <div className="h-px bg-gray-100 dark:bg-slate-800 my-1"></div>
                           <button
                             onClick={() => {
                               toggleSelectShare(share.id);
                               handleBulkDelete();
                               setActiveDropdown(null);
                             }}
                             className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-[10px] font-black uppercase tracking-widest text-red-600 transition-colors"
                           >
                             🗑️ Radera
                           </button>
                         </div>
                       </>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {currentShares.length === 0 && (
          <div className="p-24 text-center space-y-4">
            <div className="text-6xl grayscale opacity-20">📢</div>
            <p className="font-black text-brand-dark dark:text-white uppercase italic tracking-widest opacity-30">Inga delningar hittades</p>
          </div>
        )}
      </div>

      {/* Verification Iframe Lightbox */}
      {showVerifyModal && verifyingShare && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10 flex flex-col max-h-[90vh]">
            
            <div className="bg-brand-dark px-6 py-5 md:px-8 md:py-6 text-white relative overflow-hidden flex flex-col justify-center shrink-0">
               <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/20 rounded-full blur-2xl -mr-12 -mt-12" />
               <button 
                 onClick={() => { setShowVerifyModal(false); setVerifyingShare(null); }} 
                 className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors z-20 group"
                 aria-label="Stäng"
               >
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 group-hover:rotate-90 transition-transform">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
               <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter relative z-10 leading-none mb-1">Verifiera Delning</h2>
               <p className="text-white/60 text-[11px] font-medium uppercase tracking-widest relative z-10">{verifyingShare.user_name} • {verifyingShare.platform}</p>
            </div>

            {/* Warning Banner */}
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-b border-yellow-100 dark:border-yellow-800/50 p-4 shrink-0 flex items-center justify-between">
              <p className="text-xs text-yellow-800 dark:text-yellow-400 font-medium">
                <strong>Viktigt:</strong> Många sociala plattformar blockerar inbäddade vyer (iframes) av säkerhetsskäl. Är rutan grå/vit nedan?
              </p>
              <a href={verifyingShare.share_url} target="_blank" rel="noreferrer" className="shrink-0 ml-4 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-800 dark:hover:bg-yellow-700 text-yellow-800 dark:text-yellow-200 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors">
                Öppna länk i ny flik ↗
              </a>
            </div>

            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-slate-950 relative">
               <iframe 
                 src={verifyingShare.share_url} 
                 className="w-full h-full border-none absolute inset-0"
                 sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                 loading="lazy"
               />
            </div>

            <div className="p-6 md:p-8 bg-white dark:bg-slate-900 shrink-0 border-t border-gray-100 dark:border-slate-800">
               <div className="flex flex-col sm:flex-row justify-end items-center gap-4">
                 <button 
                  onClick={() => handleVerifySubmit(false)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                 >
                   ❌ Neka
                 </button>
                 <button 
                  onClick={() => handleVerifySubmit(true)}
                  disabled={actionLoading}
                  className="w-full sm:w-auto px-10 py-4 rounded-xl bg-brand-teal text-white hover:bg-brand-dark font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-teal/20"
                 >
                   ✅ Godkänn (1p)
                 </button>
               </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
