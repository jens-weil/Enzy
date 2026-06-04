"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, PlayCircle, Loader2, Video, AlertCircle } from "lucide-react";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
}

interface StreamingPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  description?: string;
}

const MOCK_VIDEOS = {
  youtube: [
    { id: 'ruOA1MWRqAU', title: 'Enzymatica – Stora Aktiedagarna Stockholm 10 mars 2026', thumbnail: 'https://i.ytimg.com/vi/ruOA1MWRqAU/mqdefault.jpg' },
    { id: '0KfVaHCnKnE', title: 'Enzymatica - Presentation Penser Bank - Forskningsbolagsdag 16 april 2020', thumbnail: 'https://i.ytimg.com/vi/0KfVaHCnKnE/mqdefault.jpg' },
    { id: '3ae_1Nr9J9M', title: 'Hisspitch – Enzymatica', thumbnail: 'https://i.ytimg.com/vi/3ae_1Nr9J9M/mqdefault.jpg' },
    { id: 'EpZKrw7z35k', title: 'Enzymatica – Filmad bolagspresentation Lund (mars 2015)', thumbnail: 'https://i.ytimg.com/vi/EpZKrw7z35k/mqdefault.jpg' },
    { id: 'g_xTfRyAw6A', title: 'ColdZyme - munsprayen som kan reducera risken för eller förkorta en förkylning', thumbnail: 'https://i.ytimg.com/vi/g_xTfRyAw6A/mqdefault.jpg' },
    { id: 'a6UTLqswgmo', title: 'ColdZyme munspray - så funkar det', thumbnail: 'https://i.ytimg.com/vi/a6UTLqswgmo/mqdefault.jpg' },
    { id: 'rTDcR6tyB9U', title: 'ColdZyme® Munspray - TV Reklam 2021', thumbnail: 'https://i.ytimg.com/vi/rTDcR6tyB9U/mqdefault.jpg' },
    { id: 'svcFchGwGvg', title: 'ColdZyme® förkylningsskola', thumbnail: 'https://i.ytimg.com/vi/svcFchGwGvg/mqdefault.jpg' },
    { id: 'IAPDNSihEVE', title: 'ColdZyme UK TV Commercial', thumbnail: 'https://i.ytimg.com/vi/IAPDNSihEVE/mqdefault.jpg' },
    { id: '0nEr5XzXP3k', title: 'COLDZYME Commercial Norway', thumbnail: 'https://i.ytimg.com/vi/0nEr5XzXP3k/mqdefault.jpg' },
    { id: 'DseoycfGBWI', title: 'ColdZyme® Munspray - mot förkylning', thumbnail: 'https://i.ytimg.com/vi/DseoycfGBWI/mqdefault.jpg' },
    { id: 'lsaQMTSKDCc', title: 'ColdZyme triple action protection against common cold', thumbnail: 'https://i.ytimg.com/vi/lsaQMTSKDCc/mqdefault.jpg' }
  ],
  vimeo: [
    { id: '148751763', title: 'The Mountain', thumbnail: 'https://i.vimeocdn.com/video/547048258_640.jpg' },
    { id: '22428395', title: 'The Eagleman Stallion', thumbnail: 'https://i.vimeocdn.com/video/141151605_640.jpg' }
  ],
  twitch: [
    { id: '1234567890', title: 'Twitch Presentation - Gaming and Beyond', thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_twitch-440x248.jpg' },
    { id: '0987654321', title: 'Live Stream: Future of Tech', thumbnail: 'https://static-cdn.jtvnw.net/previews-ttv/live_user_test-440x248.jpg' }
  ]
};

export default function StreamingPicker({
  isOpen,
  onClose,
  onSelect,
  title = "Videobibliotek",
  description = "Välj en video att infoga i artikeln"
}: StreamingPickerProps) {
  const [company, setCompany] = useState({ name: "Enzymatica", logoUrl: "/media/logo.png" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<"youtube" | "vimeo" | "twitch">("youtube");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [customError, setCustomError] = useState("");

  useEffect(() => {
    import("@/lib/settingsCache").then(m => m.fetchSettingsOnce()).then(data => {
      if (data?.company) {
        setCompany({
          name: data.company.name || "Enzymatica",
          logoUrl: data.company.logoUrl || "/media/logo.png"
        });
      }
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const fetchVideos = async () => {
      setLoading(true);
      try {
        if (!searchQuery.trim()) {
          // Fallback to mock data if query is empty
          setVideos(MOCK_VIDEOS[selectedService]);
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/videos/search?q=${encodeURIComponent(searchQuery)}&service=${selectedService}`);
        if (res.ok) {
          const data = await res.json();
          setVideos(data.results || []);
        } else {
          setVideos(MOCK_VIDEOS[selectedService]);
        }
      } catch (err) {
        console.error("Failed to search videos:", err);
        setVideos(MOCK_VIDEOS[selectedService]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchVideos, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedService, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setSearchQuery("");
      setCustomUrl("");
      setCustomError("");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleCustomUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError("");

    if (!customUrl.trim()) return;

    const url = customUrl.trim();
    // Validate YouTube, Vimeo, or generic video embed URLs
    const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
    const isVimeo = url.includes("vimeo.com");
    const isTwitch = url.includes("twitch.tv");
    const isGenericEmbed = url.startsWith("http://") || url.startsWith("https://");

    if (isYoutube || isVimeo || isTwitch || isGenericEmbed) {
      onSelect(url);
      setCustomUrl("");
    } else {
      setCustomError("Ogiltig URL. Ange en giltig YouTube, Vimeo, Twitch eller streaminglänk.");
    }
  };

  const handleVideoSelect = (video: VideoItem) => {
    let url = "";
    if (selectedService === "youtube") {
      url = `https://www.youtube.com/watch?v=${video.id}`;
    } else if (selectedService === "vimeo") {
      url = `https://player.vimeo.com/video/${video.id}`;
    } else if (selectedService === "twitch") {
      // Use parent hostname to satisfy Twitch embedding rules
      const parentHost = typeof window !== "undefined" ? window.location.hostname : "localhost";
      url = `https://player.twitch.tv/?video=${video.id}&parent=${parentHost}&autoplay=false`;
    }
    onSelect(url);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-300"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative z-10 border border-white/10">
        
        {/* Header */}
        <div className="bg-brand-dark px-8 py-6 relative overflow-hidden border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/20 rounded-full blur-3xl -mr-8 -mt-8 z-0" />
          <button 
            onClick={onClose} 
            className="absolute top-4 right-5 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-black text-white/60 hover:text-white hover:bg-brand-teal transition-all z-20 text-lg shadow-sm"
          >
            &times;
          </button>

          <div className="flex gap-4 items-center relative z-10 animate-in fade-in duration-300">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shrink-0 p-2 text-white animate-pulse">
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
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">{title}</h3>
              <p className="text-[10px] font-black text-brand-light/60 uppercase tracking-widest mt-2 leading-none">{description}</p>
            </div>
          </div>

          <div className="flex-1 max-w-md flex gap-3 relative z-10 md:mr-10">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-brand-teal transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Sök efter videor..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 rounded-xl border border-transparent bg-white/5 dark:bg-slate-950/50 outline-none focus:bg-white/10 dark:focus:bg-slate-950 focus:border-brand-teal focus:ring-4 ring-brand-teal/10 focus:ring-brand-teal/10 transition-all font-bold text-sm text-white placeholder:text-white/40 shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Tab Selection & Custom URL Input */}
        <div className="px-8 py-4 bg-gray-50 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          {/* Service Tabs */}
          <div className="flex gap-2 bg-gray-200/50 dark:bg-slate-950/40 p-1.5 rounded-2xl w-fit">
            {(["youtube", "vimeo", "twitch"] as const).map((service) => (
              <button
                key={service}
                onClick={() => { setSelectedService(service); setVideos([]); }}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedService === service
                    ? "bg-brand-teal text-white shadow-md shadow-brand-teal/10"
                    : "text-gray-500 hover:text-brand-teal hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                {service}
              </button>
            ))}
          </div>

          {/* Custom Link Form */}
          <form onSubmit={handleCustomUrlSubmit} className="flex-1 max-w-lg flex gap-3">
            <div className="relative flex-1">
              <input
                type="url"
                placeholder="Eller klistra in en direktlänk (YouTube/Vimeo/etc)..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:border-brand-teal text-xs font-bold transition-all text-gray-700 dark:text-white shadow-inner placeholder:text-gray-400"
              />
              {customError && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded shadow-lg z-30 flex items-center gap-1.5">
                  <AlertCircle size={10} />
                  <span>{customError}</span>
                </div>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-brand-teal hover:bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-teal/10 transform active:scale-95 transition-all"
            >
              Infoga länk
            </button>
          </form>
        </div>

        {/* Video Grid Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading && videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-brand-teal" strokeWidth={3} />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Söker efter klipp...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {videos.map((vid, i) => (
                <div 
                  key={vid.id} 
                  onClick={() => handleVideoSelect(vid)}
                  className="group relative flex flex-col bg-gray-50 dark:bg-slate-800/40 rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 ring-4 ring-transparent hover:ring-brand-teal/50 border border-gray-100 dark:border-slate-800/50 animate-in fade-in zoom-in-95 duration-500"
                  style={{ animationDelay: `${Math.min(i * 30, 450)}ms` }}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black flex items-center justify-center">
                    <Image
                      src={vid.thumbnail}
                      alt={vid.title}
                      fill
                      unoptimized={true}
                      className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-90"
                    />
                    
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                      <div className="w-12 h-12 rounded-full bg-white text-brand-teal flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                        <PlayCircle size={28} strokeWidth={2.5} />
                      </div>
                    </div>

                    {/* Service badge */}
                    <span className="absolute bottom-3 left-3 bg-brand-dark/80 backdrop-blur-md px-2.5 py-1 rounded text-[8px] font-black uppercase tracking-widest text-white border border-white/10">
                      {selectedService}
                    </span>
                  </div>

                  {/* Title */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed group-hover:text-brand-teal transition-colors">
                      {vid.title}
                    </h4>
                  </div>
                </div>
              ))}

              {videos.length === 0 && !loading && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3">
                  <Video className="w-12 h-12 text-gray-300 dark:text-slate-700 animate-pulse" />
                  <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">
                    Inga videor hittades
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
