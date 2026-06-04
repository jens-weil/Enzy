"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface RoleInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const ROLES: RoleInfo[] = [
  {
    id: "Anonym Besökare",
    title: "Anonym Besökare",
    icon: "🌐",
    description: "Som anonym besökare kommer du åt de flesta delarna av den publika webbplatsen såsom information om våra produkter, nyheter och investerarinformation."
  },
  {
    id: "Medlem",
    title: "Medlem",
    icon: "👤",
    description: "Som medlem kan du delta i vårt exklusiva belöningsprogram. Genom att hjälpa oss att sprida våra nyheter i dina sociala kanaler tjänar du poäng. Varje godkänd delning ger 1 poäng. När du når 10 poäng kan du lösa in dem mot en ColdZyme 20 ML i valfri smak!"
  },
  {
    id: "Partner",
    title: "Partner",
    icon: "🤝",
    description: "Som partner får du tillgång till hela webbplatsen plus vår dedikerade Partnerportal. Här kan du följa upp dina åtaganden, ladda ner professionellt marknadsföringsmaterial och hålla dig uppdaterad om de senaste claims och vetenskapliga rönen."
  },
  {
    id: "Investerare",
    title: "Investerare",
    icon: "📈",
    description: "Som registrerad investerare får du automatiskt våra senaste ekonomiska rapporter direkt till din e-post så fort de släpps, så att du alltid har full kontroll på din investering."
  }
];

interface RolesInfoModalProps {
  onClose: () => void;
  onApply: (role: string) => void;
  isLockActive: boolean;
  company?: { name: string; logoUrl: string; };
}

export default function RolesInfoModal({ onClose, onApply, isLockActive, company: providedCompany }: RolesInfoModalProps) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("Anonym Besökare");
  const [dontShow, setDontShow] = useState(false);
  const [internalCompany, setInternalCompany] = useState(providedCompany || { name: "COMPANY", logoUrl: "/media/logo.png" });

  useEffect(() => {
    if (!providedCompany) {
      import("@/lib/settingsCache").then(m => m.fetchSettingsOnce()).then(data => {
        if (data?.company) {
          setInternalCompany(data.company);
        }
      });
    } else {
      setInternalCompany(providedCompany);
    }
  }, [providedCompany]);

  const company = internalCompany;

  const handleToggle = (id: string) => {
    setExpandedRole(expandedRole === id ? null : id);
  };

  const setCookie = (name: string, value: string, minutes: number) => {
    const date = new Date();
    date.setTime(date.getTime() + (minutes * 60 * 1000));
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
  };


  const handleFinish = () => {
    if (dontShow || isLockActive) {
      setCookie("enzy_hide_role_info", "true", 60);
    }



    if (selectedRole !== "Anonym Besökare") {
      onApply(selectedRole);
    } else {
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-brand-dark px-8 py-6 text-center relative overflow-hidden border-b border-white/10 shrink-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/20 rounded-full blur-3xl -mr-8 -mt-8"></div>
          <div className="flex items-center justify-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center p-2 border border-white/20 shrink-0">
              {company.logoUrl && company.logoUrl.trim() !== "" ? (
                <Image 
                  src={company.logoUrl} 
                  alt={company.name} 
                  width={30} 
                  height={30} 
                  className="object-contain brightness-0 invert" 
                />
              ) : (
                <div className="text-xl font-black text-white/40">{company.name.charAt(0)}</div>
              )}
            </div>
            <div className="text-left">
              <h2 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">
                Välkommen till
              </h2>
              <h2 className="text-xl font-black text-brand-teal italic uppercase tracking-tighter leading-none">
                {company.name}
              </h2>
              <p className="text-brand-light/60 text-[10px] font-black uppercase tracking-widest mt-1.5 leading-none">
                Välj den roll som passar dig bäst
              </p>
            </div>
          </div>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-grow overflow-y-auto px-6 pb-3 pt-4 space-y-2">
          {ROLES.map((role) => (
            <div
              key={role.id}
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${selectedRole === role.id
                  ? "border-brand-teal bg-brand-teal/5 dark:bg-brand-teal/10 shadow-lg shadow-brand-teal/5"
                  : "border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50"
                }`}
            >
              <div className="flex items-center">
                {/* Custom Checkbox/Radio Area */}
                <div
                  onClick={() => setSelectedRole(role.id)}
                  className="pl-4 cursor-pointer group"
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedRole === role.id
                      ? "border-brand-teal bg-brand-teal"
                      : "border-gray-200 dark:border-slate-700 group-hover:border-brand-teal/50"
                    }`}>
                    {selectedRole === role.id && (
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(role.id)}
                  className="flex-grow flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{role.icon}</span>
                    <span className="font-black text-brand-dark dark:text-white uppercase italic tracking-tight group-hover:text-brand-teal transition-colors text-left">
                      {role.title}
                    </span>
                  </div>
                  <span className={`text-brand-teal transition-transform duration-300 ${expandedRole === role.id ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
              </div>

              <AnimatePresence>
                {expandedRole === role.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-5 pb-6 pt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-slate-800 mx-5 mt-1">
                      {role.description}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Action Section */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50">
          <div className="flex justify-center">
            <button
              onClick={handleFinish}
              className="w-full bg-brand-teal hover:bg-brand-dark text-white py-3.5 rounded-xl font-black uppercase text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-teal/20"
            >
              Fortsätt som {selectedRole}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
