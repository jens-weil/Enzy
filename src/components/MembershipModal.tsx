"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MembershipModal({ isOpen, onClose }: MembershipModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Regular");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [motivation, setMotivation] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const isStaff = role === "Admin" || role === "Editor";

      // Skicka all data som metadata – triggern i databasen läser och skapar profilen
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
        },
      });

      if (authErr) throw authErr;

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
        className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 my-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8 md:p-12 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black text-brand-dark dark:text-white tracking-tight">Ansök om medlemskap</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Bli en del av Enzymaticas framtid</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center font-black">&times;</button>
          </div>

          {success ? (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl">✓</div>
              <h3 className="text-2xl font-black">Ansökan skickad!</h3>
              <p className="text-gray-600 dark:text-gray-400">Vi har tagit emot din ansökan och kommer att granska den. Kontrollera din e-post för att bekräfta ditt konto.</p>
              <button onClick={onClose} className="w-full bg-brand-dark text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all">Stäng</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Önskad roll</label>
                  <select 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold text-gray-900 dark:text-white appearance-none"
                  >
                    <option value="Regular">Vanlig prenumerant</option>
                    <option value="Investor">Investerare</option>
                    <option value="Partner">Partner</option>
                    <option value="Sales">Säljare</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">E-post</label>
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lösenord</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold" />
              </div>

              {role !== "Admin" && role !== "Editor" && (
                <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fullständigt namn</label>
                      <input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefon</label>
                      <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Företag</label>
                      <input value={company} onChange={e => setCompany(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">LinkedIn URL</label>
                      <input value={linkedin} onChange={e => setLinkedin(e.target.value)} className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-bold" placeholder="https://linkedin.com/in/..." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Motivering</label>
                    <textarea value={motivation} onChange={e => setMotivation(e.target.value)} className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none font-medium h-32 resize-none" placeholder="Berätta kort varför du ansöker..." />
                  </div>
                </div>
              )}

              {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-brand-teal text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-teal/20 hover:bg-brand-dark transition-all disabled:opacity-50"
              >
                {loading ? "Skickar..." : "Skicka ansökan"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
