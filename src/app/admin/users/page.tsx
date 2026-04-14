"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  linkedin_url: string | null;
  role: string;
  membership_status: string;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed_at: string | null;
  is_banned: boolean;
  points: number;
}

export default function AdminUsersPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  
  // Forms state
  const [inviteForm, setInviteForm] = useState({ email: "", full_name: "", role: "Medlem" });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showActionDropdown, setShowActionDropdown] = useState(false);

  // Translations & Settings
  const [translations, setTranslations] = useState<any>(null);

  const translateStatus = (status: string) => {
    if (!translations?.userStatuses) return status;
    return translations.userStatuses[status] || status;
  };

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [sortConfig, setSortConfig] = useState<{ key: keyof UserProfile | 'name', direction: 'asc' | 'desc' | null }>({ key: 'created_at', direction: 'desc' });

  // Filtered and Sorted users
  const filteredAndSortedUsers = (users: UserProfile[]) => {
    let result = [...users];

    // 1. Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        (u.full_name || u.display_name)?.toLowerCase().includes(q) || 
        u.email?.toLowerCase().includes(q)
      );
    }

    // 2. Filter by Role
    if (roleFilter !== "All") {
      result = result.filter(u => u.role === roleFilter);
    }

    // 3. Filter by Status
    if (statusFilter !== "All") {
      result = result.filter(u => u.membership_status === statusFilter);
    }

    // 4. Sort
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof UserProfile];
        let bValue: any = b[sortConfig.key as keyof UserProfile];

        // Handle computed name sort
        if (sortConfig.key === 'name') {
          aValue = (a.full_name || a.display_name)?.toLowerCase();
          bValue = (b.full_name || b.display_name)?.toLowerCase();
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
  };

  const currentUsers = filteredAndSortedUsers(users);

  const toggleSelectAll = () => {
    if (selectedIds.size === currentUsers.length && currentUsers.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentUsers.map(u => u.id)));
    }
  };

  const requestSort = (key: keyof UserProfile | 'name') => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key, direction });
  };

  const toggleSelectUser = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (!confirm(`Vill du verkligen ändra status till "${status}" för ${selectedIds.size} användare?`)) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const promises = Array.from(selectedIds).map(userId => 
        fetch("/api/admin/users", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ id: userId, membership_status: status })
        })
      );

      await Promise.all(promises);
      await fetchUsers();
      setSelectedIds(new Set());
    } catch (err: any) {
      alert("Fel vid bulk-uppdatering: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`VARNING: Vill du verkligen RADERA ${selectedIds.size} användare permanent? Detta kan inte ångras.`)) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const promises = Array.from(selectedIds).map(userId => 
        fetch(`/api/admin/users?id=${userId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${session?.access_token}`
          }
        })
      );

      await Promise.all(promises);
      await fetchUsers();
      setSelectedIds(new Set());
    } catch (err: any) {
      alert("Fel vid bulk-radering: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (profile?.role !== "Admin") {
        router.push("/");
      } else {
        const loadInitialData = async () => {
          // Fetch settings for translations
          try {
            const { data: { session } } = await supabase.auth.getSession();
            const setRes = await fetch("/api/settings", {
              headers: { 'Authorization': `Bearer ${session?.access_token}` }
            });
            if (setRes.ok) {
              const setData = await setRes.json();
              if (setData.translations) setTranslations(setData.translations);
            }
          } catch (err) {
            console.error("Failed to load settings:", err);
          }
          
          await fetchUsers();
        };

        loadInitialData();
      }
    }
  }, [profile, authLoading, router]);

  const fetchUsers = async () => {
    setFetching(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch users");
      }
      
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async (userId: string, updates: Partial<UserProfile>) => {
    setActionLoading(true);
    
    if (editingUser && editingUser.id === userId) {
      setEditingUser({ ...editingUser, ...updates });
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ id: userId, ...updates })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      
      await fetchUsers(); // Refresh list silently in background without closing the modal
    } catch (err: any) {
      alert("Error updating user: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: "invite", ...inviteForm })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Invitation failed");
      }
      
      setActionMessage({ type: "success", text: `Inbjudan skickad till ${inviteForm.email}!` });
      setInviteForm({ email: "", full_name: "", role: "Medlem" });
      setTimeout(() => setShowInviteModal(false), 2000);
      await fetchUsers();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };


  const roleDisplayMap: Record<string, string> = {
    "Admin": "Admin",
    "Editor": "Redaktör",
    "Redaktör": "Redaktör",
    "Regular": "Medlem",
    "Medlem": "Medlem",
    "Investor": "Investerare",
    "Investerare": "Investerare",
    "Partner": "Partner",
    "Sales": "Säljare",
    "Säljare": "Säljare"
  };

  const handleSendMagicLink = async (email: string) => {
    if (!confirm(`Vill du skicka en magisk länk för direktinloggning till ${email}?`)) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: "magiclink", email })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send magic link");
      }
      
      alert(`En magisk länk har skickats till ${email}!`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (!confirm(`VARNING: Vill du verkligen RADERA ${u.full_name || u.display_name} permanent? Detta kan inte ångras.`)) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/admin/users?id=${u.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`
        }
      });

      if (!res.ok) throw new Error("Kunde inte radera användare");
      await fetchUsers();
      alert("Användaren har raderats.");
    } catch (err: any) {
      alert("Fel: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    if (!confirm(`Vill du skicka en länk för lösenordsåterställning till ${email}?`)) return;
    
    setActionLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: "password_reset", email })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to trigger password reset");
      }
      
      alert(`Ett mejl för lösenordsåterställning har skickats till ${email}!`);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || (fetching && users.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin mb-4" />
        <p className="font-black text-brand-teal uppercase tracking-widest animate-pulse">Laddar användare...</p>
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
            Användarhantering
          </h1>
          <p className="text-lg text-gray-500 font-medium max-w-xl">
            Hantera roller, godkänn medlemsansökningar och bjud in nya medarbetare till portalen.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-brand-teal text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-brand-teal/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
              >
                <span className="text-xl">+</span> Bjud in medlem
              </button>
            </div>
      </div>

      {/* Integrated Management Box */}
      <div className="bg-white dark:bg-slate-900 rounded-[1.25rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
        {/* Search & Filter Row */}
        <div className="px-6 py-3 md:px-8 flex flex-col md:flex-row gap-4 border-b border-gray-50 dark:border-slate-800/50">
          <div className="flex-1 relative group">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl grayscale opacity-30 group-focus-within:opacity-100 transition-opacity">🔍</span>
            <input 
              type="text" 
              placeholder="Sök namn eller e-post..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-bold text-sm dark:text-white transition-all"
            />
          </div>
          <div className="flex gap-4">
            <select 
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-6 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-black text-[10px] uppercase tracking-widest dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all font-sans"
            >
              <option value="All">Alla Roller</option>
              <option value="Admin">Admin</option>
              <option value="Redaktör">Redaktör</option>
              <option value="Partner">Partner</option>
              <option value="Investerare">Investerare</option>
              <option value="Säljare">Säljare</option>
              <option value="Medlem">Medlem</option>
            </select>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-6 py-2.5 rounded-xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-black text-[10px] uppercase tracking-widest dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-all font-sans"
            >
              <option value="All">Alla Statusar</option>
              <option value="Approved">{translateStatus("Approved")}</option>
              <option value="Pending">{translateStatus("Pending")}</option>
              <option value="Rejected">{translateStatus("Rejected")}</option>
              <option value="Banned">{translateStatus("Banned")}</option>
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
              {showActionDropdown && (
                <div className="fixed inset-0 z-40" onClick={() => setShowActionDropdown(false)} />
              )}
              <button 
                onClick={() => setShowActionDropdown(!showActionDropdown)}
                className="px-5 py-2.5 rounded-xl bg-brand-teal/10 hover:bg-brand-teal border border-brand-teal/20 text-brand-teal hover:text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-sm flex items-center gap-2 relative z-50"
              >
                Åtgärder
                <span className={`text-[8px] transition-transform ${showActionDropdown ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {showActionDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95">
                  {selectedIds.size === 1 && (
                    <>
                      <button 
                        onClick={() => {
                          const id = Array.from(selectedIds)[0];
                          const u = users.find(user => user.id === id);
                          if (u) { setEditingUser(u); setShowEditModal(true); }
                          setShowActionDropdown(false);
                        }}
                        className="w-full text-left px-5 py-3 hover:bg-brand-light dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-brand-dark dark:text-gray-200 transition-colors"
                      >
                        ✏️ Redigera
                      </button>
                      <button 
                        onClick={() => {
                          const id = Array.from(selectedIds)[0];
                          const u = users.find(user => user.id === id);
                          if (u) handleSendMagicLink(u.email);
                          setShowActionDropdown(false);
                        }}
                        className="w-full text-left px-5 py-3 hover:bg-brand-light dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-brand-dark dark:text-gray-200 transition-colors"
                      >
                        🔗 Magisk länk
                      </button>
                      <button 
                        onClick={() => {
                          const id = Array.from(selectedIds)[0];
                          const u = users.find(user => user.id === id);
                          if (u) handlePasswordReset(u.email);
                          setShowActionDropdown(false);
                        }}
                        className="w-full text-left px-5 py-3 hover:bg-brand-light dark:hover:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-brand-dark dark:text-gray-200 transition-colors"
                      >
                        🔑 Lösenord
                      </button>
                      <div className="h-px bg-gray-100 dark:bg-slate-800 my-1"></div>
                    </>
                  )}
                  <button 
                    onClick={() => { handleBulkStatusUpdate("Banned"); setShowActionDropdown(false); }}
                    className="w-full text-left px-5 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-[10px] font-black uppercase tracking-widest text-red-500 transition-colors"
                  >
                    🚫 Deaktivera
                  </button>
                  <button 
                    onClick={() => { handleBulkDelete(); setShowActionDropdown(false); }}
                    className="w-full text-left px-5 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-[10px] font-black uppercase tracking-widest text-red-600 transition-colors"
                  >
                    🗑️ Radera
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Data Grid Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-800">
                <th className="px-6 py-3 w-10">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.size === currentUsers.length && currentUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 rounded border-2 border-gray-200 dark:border-slate-700 text-brand-teal focus:ring-brand-teal transition-all cursor-pointer"
                    />
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('name')}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-teal transition-colors"
                >
                  <div className="flex items-center gap-2">
                     Användare
                     {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : '')}
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('email')}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 cursor-pointer hover:text-brand-teal transition-colors hidden md:table-cell"
                >
                  <div className="flex items-center gap-2">
                     E-post
                     {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : '')}
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('membership_status')}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 cursor-pointer hover:text-brand-teal transition-colors"
                >
                  <div className="flex items-center gap-2">
                     Status
                     {sortConfig.key === 'membership_status' && (sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : '')}
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('role')}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 cursor-pointer hover:text-brand-teal transition-colors"
                >
                  <div className="flex items-center gap-2">
                     Roll
                     {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : '')}
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('created_at')}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 cursor-pointer hover:text-brand-teal transition-colors hidden lg:table-cell"
                >
                  <div className="flex items-center gap-2">
                     Skapad
                     {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : '')}
                  </div>
                </th>
                <th 
                  onClick={() => requestSort('last_sign_in_at')}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 cursor-pointer hover:text-brand-teal transition-colors hidden xl:table-cell"
                >
                  <div className="flex items-center gap-2">
                     Senast
                     {sortConfig.key === 'last_sign_in_at' && (sortConfig.direction === 'asc' ? '↑' : sortConfig.direction === 'desc' ? '↓' : '')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {currentUsers.map(u => (
                <tr key={u.id} className={`group transition-all duration-300 ${selectedIds.has(u.id) ? "bg-brand-teal/5 dark:bg-brand-teal/5" : "hover:bg-gray-50/50 dark:hover:bg-slate-800/50"}`}>
                  <td className="px-6 py-3">
                     <div className="flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                        className={`w-5 h-5 rounded border-2 transition-all cursor-pointer ${selectedIds.has(u.id) ? "border-brand-teal bg-brand-teal text-white" : "border-gray-200 dark:border-slate-700 text-brand-teal focus:ring-brand-teal"}`}
                      />
                    </div>
                  </td>
                  <td 
                    className="px-6 py-3 cursor-pointer group/user"
                    onClick={() => { setEditingUser(u); setShowEditModal(true); }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-brand-teal/10 flex flex-col items-center justify-center text-brand-teal font-black group-hover/user:scale-110 group-hover/user:bg-brand-teal group-hover/user:text-white transition-all">
                        <span className="text-sm leading-none">{u.points || 0}</span>
                        <span className="text-[8px] uppercase font-bold opacity-60 leading-none">poäng</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-brand-dark dark:text-white uppercase italic tracking-tight group-hover/user:text-brand-teal transition-colors text-xs">{u.full_name || u.display_name}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 hidden md:table-cell">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {u.email}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <select 
                      value={u.membership_status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleUpdate(u.id, { membership_status: e.target.value })}
                      disabled={actionLoading}
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md border-none appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-brand-teal/10 transition-all ${
                        u.membership_status === "Approved" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        u.membership_status === "Pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" : 
                        u.membership_status === "Banned" ? "bg-red-500 text-white" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      <option value="Approved">{translateStatus("Approved")}</option>
                      <option value="Pending">{translateStatus("Pending")}</option>
                      <option value="Rejected">{translateStatus("Rejected")}</option>
                      <option value="Banned">{translateStatus("Banned")}</option>
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <select 
                      value={u.role}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleUpdate(u.id, { role: e.target.value })}
                      disabled={actionLoading}
                      className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 border-none appearance-none cursor-pointer outline-none hover:bg-gray-200 dark:hover:bg-slate-700 focus:ring-4 focus:ring-brand-teal/10 transition-all font-sans"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Redaktör">Redaktör</option>
                      <option value="Partner">Partner</option>
                      <option value="Investerare">Investerare</option>
                      <option value="Säljare">Säljare</option>
                      <option value="Medlem">Medlem</option>
                    </select>
                  </td>
                  <td className="px-6 py-3 hidden lg:table-cell">
                     <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {new Date(u.created_at).toLocaleDateString('sv-SE')}
                    </span>
                  </td>
                  <td className="px-6 py-3 hidden xl:table-cell">
                    {u.last_sign_in_at ? (
                      <span className="text-[9px] font-bold text-brand-teal uppercase tracking-widest">
                        {new Date(u.last_sign_in_at).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    ) : (
                      <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest italic">Aldrig</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {currentUsers.length === 0 && (
          <div className="p-24 text-center space-y-4">
            <div className="text-6xl grayscale opacity-20">👥</div>
            <p className="font-black text-brand-dark dark:text-white uppercase italic tracking-widest opacity-30">Inga användare hittades</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
            <div className="bg-brand-teal p-10 text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-16 -mt-16" />
               <h2 className="text-3xl font-black uppercase italic tracking-tighter relative z-10">Bjud in medlem</h2>
               <p className="text-white/80 font-medium relative z-10">Skicka ett välkomstmejl och skapa en profil direkt.</p>
            </div>
            
            <form onSubmit={handleInvite} className="p-10 space-y-8">
               <div className="space-y-6">
                 <label className="block space-y-2">
                   <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">E-postadress</span>
                   <input 
                    required
                    type="email"
                    value={inviteForm.email}
                    onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                    placeholder="namn@organisation.se"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-bold dark:text-white"
                   />
                 </label>

                 <label className="block space-y-2">
                   <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Namn</span>
                   <input 
                    required
                    type="text"
                    value={inviteForm.full_name}
                    onChange={e => setInviteForm({...inviteForm, full_name: e.target.value})}
                    placeholder="Förnamn Efternamn"
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-bold dark:text-white"
                   />
                 </label>

                 <label className="block space-y-2">
                   <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Standardroll</span>
                   <select 
                    value={inviteForm.role}
                    onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-black text-[10px] uppercase tracking-widest dark:text-white"
                   >
                    <option value="Medlem">Medlem</option>
                    <option value="Investerare">Investerare</option>
                    <option value="Partner">Partner</option>
                    <option value="Säljare">Säljare</option>
                    <option value="Redaktör">Redaktör</option>
                    <option value="Admin">Admin</option>
                   </select>
                 </label>
               </div>

               {actionMessage && (
                 <div className={`p-5 rounded-2xl font-bold text-sm ${actionMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                   {actionMessage.text}
                 </div>
               )}

               <div className="flex gap-4">
                 <button 
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-5 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-400 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                 >
                   Avbryt
                 </button>
                 <button 
                  disabled={actionLoading}
                  type="submit"
                  className="flex-2 px-12 py-5 rounded-2xl bg-brand-teal text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-teal/20 hover:bg-brand-dark transition-all disabled:opacity-50"
                 >
                   {actionLoading ? "Skickar..." : "Skicka inbjudan"}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-3xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/10">
            <div className="bg-brand-dark px-6 py-5 md:px-8 md:py-6 text-white relative overflow-hidden flex flex-col justify-center">
               <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/20 rounded-full blur-2xl -mr-12 -mt-12" />
               <button 
                 onClick={() => setShowEditModal(false)} 
                 className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors z-20 group"
                 aria-label="Stäng"
               >
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 group-hover:rotate-90 transition-transform">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
               <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter relative z-10 leading-none mb-1">Redigera användare</h2>
               <p className="text-white/60 text-[11px] font-medium uppercase tracking-widest relative z-10">{editingUser.full_name || editingUser.display_name}</p>
            </div>
            
            <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto space-y-6 scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b border-gray-100 dark:border-slate-800">
                  <label className="block space-y-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Roll</span>
                    <select 
                      value={editingUser.role}
                      onChange={e => handleUpdate(editingUser.id, { role: e.target.value })}
                      className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-black text-[10px] uppercase tracking-widest dark:text-white cursor-pointer"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Redaktör">Redaktör</option>
                      <option value="Partner">Partner</option>
                      <option value="Investerare">Investerare</option>
                      <option value="Säljare">Säljare</option>
                      <option value="Medlem">Medlem</option>
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Medlemsstatus</span>
                    <select 
                      value={editingUser.membership_status}
                      onChange={e => handleUpdate(editingUser.id, { membership_status: e.target.value })}
                      className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-black text-[10px] uppercase tracking-widest dark:text-white cursor-pointer"
                    >
                      <option value="Approved">{translateStatus("Approved")}</option>
                      <option value="Pending">{translateStatus("Pending")}</option>
                      <option value="Rejected">{translateStatus("Rejected")}</option>
                      <option value="Banned">{translateStatus("Banned")}</option>
                    </select>
                  </label>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block space-y-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Fullständigt Namn</span>
                    <input 
                     type="text"
                     defaultValue={editingUser.full_name || ""}
                     onBlur={e => handleUpdate(editingUser.id, { full_name: e.target.value })}
                     className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-bold dark:text-white text-sm"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Företag / Organisation</span>
                    <input 
                     type="text"
                     defaultValue={editingUser.company || ""}
                     onBlur={e => handleUpdate(editingUser.id, { company: e.target.value })}
                     className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-bold dark:text-white text-sm"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">Telefonnummer</span>
                    <input 
                     type="tel"
                     defaultValue={editingUser.phone || ""}
                     onBlur={e => handleUpdate(editingUser.id, { phone: e.target.value })}
                     className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-bold dark:text-white text-sm"
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-2">LinkedIn URL</span>
                    <input 
                     type="url"
                     defaultValue={editingUser.linkedin_url || ""}
                     onBlur={e => handleUpdate(editingUser.id, { linkedin_url: e.target.value })}
                     className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none outline-none focus:ring-4 focus:ring-brand-teal/10 font-bold dark:text-white text-sm"
                    />
                  </label>
                </div>
               
               <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                 <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                   <button 
                     onClick={() => handleSendMagicLink(editingUser.email)} 
                     className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-teal hover:text-brand-dark transition-colors"
                   >
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                     </svg>
                     <span className="hidden sm:inline">Skicka magisk länk</span>
                     <span className="sm:hidden">Magisk länk</span>
                   </button>

                   <button 
                     onClick={() => handlePasswordReset(editingUser.email)} 
                     className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-teal hover:text-brand-dark transition-colors"
                   >
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                     </svg>
                     <span className="hidden sm:inline">Återställ lösenord</span>
                     <span className="sm:hidden">Lösenord</span>
                   </button>

                   <button 
                     onClick={() => router.push(`/admin/shares?userId=${editingUser.id}`)}
                     className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-teal hover:text-brand-dark transition-colors"
                   >
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                     </svg>
                     <span className="hidden sm:inline">Visa delningar</span>
                     <span className="sm:hidden">Delningar</span>
                   </button>
                 </div>
                 
                 <div className="flex w-full sm:w-auto gap-3 mt-4 sm:mt-0">
                   <button 
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 font-black text-[10px] uppercase tracking-widest transition-colors text-center"
                   >
                     Avbryt
                   </button>
                   <button 
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 sm:flex-none px-8 py-3 rounded-xl bg-brand-dark text-white hover:bg-brand-teal font-black text-[10px] uppercase tracking-widest transition-colors text-center shadow-lg"
                   >
                     Klar
                   </button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

