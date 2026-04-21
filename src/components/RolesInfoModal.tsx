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
        className="bg-[#0f1218] border border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-6 bg-gradient-to-br from-brand-teal/20 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/10 rounded-full blur-2xl -mr-16 -mt-16" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center p-2 border border-white/20">
              {company.logoUrl && company.logoUrl.trim() !== "" ? (
                <Image 
                  src={company.logoUrl} 
                  alt={company.name} 
                  width={40} 
                  height={40} 
                  className="object-contain brightness-0 invert" 
                />
              ) : (
                <div className="text-xl font-black text-white/40">{company.name.charAt(0)}</div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">
                Välkommen till
              </h2>
              <h2 className="text-2xl font-black text-brand-teal italic uppercase tracking-tighter leading-tight">
                {company.name}
              </h2>
            </div>
          </div>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest pl-1 opacity-60">
            Välj den roll som passar dig bäst.
          </p>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-grow overflow-y-auto px-6 pb-3 pt-4 space-y-2">
          {ROLES.map((role) => (
            <div
              key={role.id}
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${selectedRole === role.id
                  ? "border-brand-teal bg-brand-teal/5 shadow-lg shadow-brand-teal/5"
                  : "border-white/5 bg-white/2"
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
                      : "border-white/20 group-hover:border-brand-teal/50"
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
                  className="flex-grow flex items-center justify-between p-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{role.icon}</span>
                    <span className="font-black text-white uppercase italic tracking-tight group-hover:text-brand-teal transition-colors text-left">
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
                    <div className="px-5 pb-6 pt-1 text-sm text-gray-400 leading-relaxed border-t border-white/5 mx-5 mt-1">
                      {role.description}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Action Section */}
        <div className="p-4 border-t border-white/5 bg-[#0a0c10]/50">
          <div className="flex justify-center">

            <button
              onClick={handleFinish}
              className="w-full md:w-auto px-8 py-3 bg-brand-teal text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-teal/20"
            >
              Fortsätt som {selectedRole}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
