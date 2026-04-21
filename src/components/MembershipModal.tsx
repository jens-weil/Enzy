"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: string;
}

export default function MembershipModal({ isOpen, onClose, initialRole }: MembershipModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initialRole || "Medlem");

  useEffect(() => {
    if (initialRole) setRole(initialRole);
  }, [initialRole]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [linkedin, setLinkedin] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isStaff = role === "Admin" || role === "Editor" || role === "Redaktör";

      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
            full_name: isStaff ? "" : fullName,
            phone: isStaff ? "" : phone,
            company: isStaff ? "" : company,
            linkedin_url: isStaff ? "" : linkedin,
            display_name: fullName || email.split("@")[0],
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authErr) throw authErr;

      const setCookie = (name: string, value: string, minutes: number) => {
        const date = new Date();
        date.setTime(date.getTime() + (minutes * 60 * 1000));
        document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
      };


      setCookie("enzy_site_unlocked", "true", 60);
      setCookie("enzy_last_unlocked_at", Date.now().toString(), 60);
      setCookie("enzy_hide_role_info", "true", 60);



      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Ett fel uppstod vid ansökan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="p-5 pb-6 bg-gradient-to-br from-brand-teal/20 to-transparent relative border-b border-gray-50 dark:border-slate-800/50">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-5 w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center font-black hover:bg-brand-teal hover:text-white transition-all z-10 text-lg shadow-sm"
          >
            &times;
          </button>
          <h2 className="text-xl font-black text-brand-dark dark:text-white italic uppercase tracking-tighter mb-1">
            Ansök om medlemskap
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-[10px] leading-relaxed max-w-sm font-medium uppercase tracking-widest">
            Fyll i dina uppgifter nedan
          </p>
        </div>

        <div className="px-8 pt-8 pb-10">

          {success ? (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl">✓</div>
              <h3 className="text-2xl font-black">Ansökan skickad!</h3>
              <p className="text-gray-600 dark:text-gray-400">Vi har tagit emot din ansökan och kommer att granska den. Kontrollera din e-post för att bekräfta ditt konto.</p>
              <button onClick={onClose} className="w-full bg-brand-dark text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all">Stäng</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Önskad roll</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="Medlem">Medlem</option>
                    <option value="Investerare">Investerare</option>
                    <option value="Partner">Partner</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-post</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lösenord</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold" />
              </div>

              {role !== "Admin" && role !== "Editor" && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fullständigt namn</label>
                      <input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefon</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Företag</label>
                      <input value={company} onChange={e => setCompany(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">LinkedIn URL</label>
                      <input value={linkedin} onChange={e => setLinkedin(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold" placeholder="https://linkedin.com/in/..." />
                    </div>
                  </div>
                </div>
              )}

              {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-brand-teal text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-teal/20 hover:bg-brand-dark transition-all disabled:opacity-50"
                >
                  {loading ? "Skickar..." : "Skicka ansökan"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

