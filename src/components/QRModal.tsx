"use client";

import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useState, useEffect } from "react";
import { Share2, X, Copy, Check, Maximize2, Minimize2 } from "lucide-react";

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QRModal({ isOpen, onClose }: QRModalProps) {
  const [currentUrl, setCurrentUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && isOpen) {
      setCurrentUrl(window.location.href);
    }
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className={`fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center ${isMaximized ? 'p-0' : 'p-4'}`}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`bg-white dark:bg-slate-900 shadow-2xl overflow-hidden relative border border-gray-100 dark:border-slate-800 transition-all duration-300 ${
              isMaximized 
                ? 'w-full h-full max-w-none rounded-none' 
                : 'w-full max-w-sm rounded-[2.5rem]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#0A0F1E] px-8 py-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/20 rounded-full blur-3xl -mr-8 -mt-8 z-0" />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 mb-2">
                  <Share2 className="text-brand-teal" size={24} />
                </div>
                <h2 className={`font-black text-white tracking-tight uppercase italic transition-all duration-500 ${isMaximized ? 'text-6xl mb-4' : 'text-xl'}`}>Dela appen</h2>
                <p className={`text-brand-light/60 font-black uppercase tracking-widest leading-none transition-all duration-500 ${isMaximized ? 'text-xl' : 'text-[10px]'}`}>Skanna för mobilvy</p>
              </div>
              <div className="absolute top-5 right-5 flex items-center gap-2 z-[60]">
                <button
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="text-white/40 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                  title={isMaximized ? "Minimera" : "Maximera"}
                >
                  {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button 
                  onClick={onClose}
                  className="text-white/40 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* QR Code Content */}
            <div className={`flex flex-col items-center justify-center text-center flex-1 transition-all duration-500 ${isMaximized ? 'p-20' : 'p-10 gap-8'}`}>
              <div className={`bg-white shadow-2xl border-4 border-gray-50 flex items-center justify-center transition-all duration-500 ${isMaximized ? 'p-12 rounded-[4rem]' : 'p-6 rounded-[2.5rem]'}`}>
                <QRCodeSVG
                  value={currentUrl}
                  size={isMaximized ? 550 : 180}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className={`w-full transition-all duration-500 ${isMaximized ? 'max-w-md mt-12' : 'space-y-4'}`}>
                <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-brand-teal/20 transition-all group">
                   <div className="flex flex-col text-left overflow-hidden flex-1">
                     <span className={`font-black text-gray-400 uppercase tracking-widest mb-1 italic transition-all duration-500 ${isMaximized ? 'text-sm' : 'text-[9px]'}`}>Aktuell sida</span>
                     <span className={`font-bold text-gray-700 dark:text-gray-300 truncate pr-4 transition-all duration-500 ${isMaximized ? 'text-2xl' : 'text-xs'}`}>
                        {currentUrl.replace(/^https?:\/\//, '') || "Hämtar URL..."}
                     </span>
                   </div>
                   <button 
                    onClick={handleCopy}
                    className={`shrink-0 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      isMaximized ? 'w-16 h-16' : 'w-10 h-10'
                    } ${
                      copied ? "bg-green-500 text-white" : "bg-brand-teal/10 text-brand-teal hover:bg-brand-teal hover:text-white"
                    }`}
                   >
                     {copied ? <Check size={isMaximized ? 32 : 18} /> : <Copy size={isMaximized ? 32 : 18} />}
                   </button>
                </div>
              </div>
            </div>


          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
