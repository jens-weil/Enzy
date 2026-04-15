"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
}

export default function RolesInfoModal({ onClose, onApply, isLockActive }: RolesInfoModalProps) {
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("Anonym Besökare");
  const [dontShow, setDontShow] = useState(false);

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
        className="bg-[#0f1218] border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 pb-10 bg-gradient-to-br from-brand-teal/20 to-transparent">
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">
            Välkommen till Enzymatica
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-lg">
            Här är en översikt av de olika användarrollerna. Välj den roll som passar dig bäst genom att klicka i rutan vid respektive rollbeskrivning.
          </p>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-grow overflow-y-auto px-8 pb-8 space-y-3">
          {ROLES.map((role) => (
            <div 
              key={role.id} 
              className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                selectedRole === role.id 
                ? "border-brand-teal bg-brand-teal/5 shadow-lg shadow-brand-teal/5" 
                : "border-white/5 bg-white/2"
              }`}
            >
              <div className="flex items-center">
                {/* Custom Checkbox/Radio Area */}
                <div 
                  onClick={() => setSelectedRole(role.id)}
                  className="pl-5 cursor-pointer group"
                >
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    selectedRole === role.id 
                    ? "border-brand-teal bg-brand-teal" 
                    : "border-white/20 group-hover:border-brand-teal/50"
                  }`}>
                    {selectedRole === role.id && (
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(role.id)}
                  className="flex-grow flex items-center justify-between p-5 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{role.icon}</span>
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
        <div className="p-8 border-t border-white/5 bg-[#0a0c10]/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1">
               {/* Conditional "Don't show again" checkbox */}
               {!isLockActive ? (
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={dontShow}
                    onChange={(e) => setDontShow(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-white/10 bg-transparent text-brand-teal focus:ring-brand-teal transition-all cursor-pointer"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
                    Visa inte denna info igen
                  </span>
                </label>
               ) : (
                 <p className="text-[10px] font-black uppercase tracking-widest text-brand-teal/40">
                    Säkerhetsportal aktiv
                 </p>
               )}
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mt-2">
                 Vald roll: <span className="text-white italic">{selectedRole}</span>
               </p>
            </div>
            
            <button
              onClick={handleFinish}
              className="w-full md:w-auto px-12 py-5 bg-brand-teal text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-teal/20"
            >
              Fortsätt som {selectedRole}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
