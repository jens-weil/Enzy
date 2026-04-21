"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Loader2, Search, Tag, Trash2, Check, AlertCircle, ChevronDown, Filter } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  title?: string;
  description?: string;
}

export default function MediaPicker({ 
  isOpen, 
  onClose, 
  onSelect, 
  title = "Mediebibliotek",
  description = "Välj en bild eller ladda upp en ny"
}: MediaPickerProps) {
  const { session } = useAuth();
  const [availableImages, setAvailableImages] = useState<{url: string, tags: string[]}[]>([]);
  const [systemTags, setSystemTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Interaction states
  const [taggingImage, setTaggingImage] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (isOpen && session) {
      fetchImages();
      setSearchQuery("");
      setSelectedTag(null);
      setTaggingImage(null);
      setDeletingImage(null);
      setIsTagDropdownOpen(false);
    }
  }, [isOpen, session]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/images", {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await res.json();
      setAvailableImages(data.images || []);
      setSystemTags(data.systemTags || []);
    } catch (err) {
      console.error("Failed to fetch images:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/images", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        // The API returns { url, tags }
        const newImage = { url: data.url, tags: data.tags || [] };
        setAvailableImages(prev => [newImage, ...prev]);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    try {
      const res = await fetch(`/api/images?url=${encodeURIComponent(url)}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (res.ok) {
        setAvailableImages(prev => prev.filter(img => img.url !== url));
        setDeletingImage(null);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Radering misslyckades");
        setTimeout(() => setErrorMessage(null), 3000);
      }
    } catch (err) {
      setErrorMessage("Kunde inte radera bilden");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleTagUpdate = async (url: string, newTags: string[]) => {
    try {
      const res = await fetch("/api/images", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ url, tags: newTags }),
      });

      if (res.ok) {
        setAvailableImages(prev => prev.map(img => 
          img.url === url ? { ...img, tags: newTags } : img
        ));
      }
    } catch (err) {
      console.error("Tag update failed:", err);
    }
  };

  const addTag = (url: string, tags: string[], tagToAdd?: string) => {
    const tag = tagToAdd || newTag;
    if (!tag.trim()) return;
    const cleanTag = tag.trim().toLowerCase();
    if (tags.includes(cleanTag)) {
      setNewTag("");
      return;
    }
    const updated = [...tags, cleanTag];
    handleTagUpdate(url, updated);
    setNewTag("");
  };

  const removeTag = (url: string, tags: string[], tagToRemove: string) => {
    const updated = tags.filter(t => t !== tagToRemove);
    handleTagUpdate(url, updated);
  };

  // Computed
  const allUniqueTags = useMemo(() => {
    const tags = new Set<string>();
    availableImages.forEach(img => img.tags?.forEach(t => tags.add(t)));
    systemTags.forEach(t => tags.add(t));
    return Array.from(tags).sort();
  }, [availableImages, systemTags]);

  const filteredImages = useMemo(() => {
    return availableImages.filter(img => {
      const matchesSearch = img.url.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          img.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = !selectedTag || img.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [availableImages, searchQuery, selectedTag]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-brand-dark/95 backdrop-blur-2xl" onClick={onClose} />
      
      {/* Error Toast */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[1100] bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-red-400/50"
          >
            <AlertCircle size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden relative z-10 border border-white/10">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between bg-gray-50 dark:bg-slate-900/50 gap-6">
          <div className="flex gap-6 items-center">
            <div>
              <h3 className="text-3xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter leading-none">{title}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2 leading-none">{description}</p>
            </div>
          </div>

          <div className="flex-1 max-w-xl flex gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-teal transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Sök på filnamn eller taggar..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:ring-4 ring-brand-teal/10 focus:border-brand-teal transition-all font-bold text-sm dark:text-white shadow-inner"
              />
            </div>

            {/* Tag Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                className={`h-full px-6 rounded-2xl border flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${
                  selectedTag 
                    ? 'bg-brand-teal text-white border-transparent shadow-lg shadow-brand-teal/20' 
                    : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-500 hover:border-brand-teal/50 hover:text-brand-teal'
                }`}
              >
                <Filter size={16} className={selectedTag ? "animate-pulse" : ""} />
                <span>{selectedTag ? `#${selectedTag}` : "Alla Taggar"}</span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isTagDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isTagDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 5, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[1.5rem] shadow-2xl z-[100] overflow-hidden backdrop-blur-xl flex flex-col"
                  >
                    {/* Global Tag Creation */}
                    <div className="p-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Skapa ny global tagg..." 
                          className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-[9px] font-bold outline-none focus:border-brand-teal"
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                              const val = (e.target as HTMLInputElement).value;
                              if (!val.trim()) return;
                              await fetch("/api/images", {
                                method: "PATCH",
                                headers: { 
                                  "Content-Type": "application/json",
                                  "Authorization": `Bearer ${session?.access_token}`
                                },
                                body: JSON.stringify({ action: 'globalCreateTag', newTag: val })
                              });
                              (e.target as HTMLInputElement).value = "";
                              fetchImages();
                            }
                          }}
                        />
                        <div className="w-8 h-8 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center">
                          <Plus size={14} />
                        </div>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
                      <button 
                         onClick={() => { setSelectedTag(null); setIsTagDropdownOpen(false); }}
                         className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 ${
                           !selectedTag ? 'bg-brand-teal/10 text-brand-teal' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                         }`}
                      >
                        Alla Bilder
                      </button>
                      {allUniqueTags.map(tag => (
                        <div key={tag} className="flex items-center gap-1 mb-1 group/tagrow">
                          <button 
                            onClick={() => { setSelectedTag(tag); setIsTagDropdownOpen(false); }}
                            className={`flex-1 text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                              selectedTag === tag ? 'bg-brand-teal/10 text-brand-teal' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            #{tag}
                          </button>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`Vill du radera taggen "#${tag}" från ALLA bilder?`)) {
                                await fetch("/api/images", {
                                  method: "PATCH",
                                  headers: { 
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${session?.access_token}`
                                  },
                                  body: JSON.stringify({ action: 'globalDeleteTag', tagToDelete: tag })
                                });
                                if (selectedTag === tag) setSelectedTag(null);
                                fetchImages();
                              }
                            }}
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover/tagrow:opacity-100"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      {allUniqueTags.length === 0 && (
                        <div className="p-4 text-center">
                          <p className="text-[10px] font-black text-gray-400 uppercase italic">Inga taggar tillgängliga</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-xl font-black hover:bg-brand-teal hover:text-white transition-all hover:rotate-90 active:scale-90"
          >
            <X size={24} />
          </button>
        </div>

        
        {/* Content Grid - Overhauled Columns & Gap */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading && availableImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-brand-teal" strokeWidth={3} />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Analyserar bibliotek...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
              
              {/* Upload Card */}
              {!searchQuery && !selectedTag && (
                <label className="relative aspect-[4/5] rounded-2xl border-4 border-dashed border-brand-teal/20 flex flex-col items-center justify-center cursor-pointer hover:bg-brand-teal/5 hover:border-brand-teal/40 transition-all group overflow-hidden bg-gray-50/50 dark:bg-slate-800/50 shadow-inner">
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                  {uploading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-brand-teal" strokeWidth={3} />
                      <span className="text-[8px] font-black uppercase text-brand-teal">Laddar upp...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center transition-transform group-hover:scale-125">
                        <Plus size={24} strokeWidth={3} />
                      </div>
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Ladda upp</span>
                    </div>
                  )}
                </label>
              )}
              
              {/* Image Grid */}
              {filteredImages.map((img, i) => (
                <div key={img.url} className="relative group aspect-[4/5] animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}>
                  <motion.div 
                    layout
                    onClick={() => onSelect(img.url)} 
                    className="w-full h-full rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 ring-4 ring-transparent hover:ring-brand-teal/50 relative"
                  >
                    <Image 
                      src={img.url} 
                      alt="Media Asset" 
                      fill 
                      unoptimized={img.url.endsWith('.svg') || img.url.endsWith('.gif')}
                      className="object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    
                    {/* Interaction Overlay */}
                    <div className="absolute inset-0 bg-brand-dark/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4 duration-500 backdrop-blur-[2px]">
                      <span className="text-[8px] font-black text-white uppercase tracking-widest bg-brand-teal px-4 py-2 rounded-full shadow-xl shadow-brand-teal/20">Använd Bild</span>
                      
                      {/* Miniaturized Chips display */}
                      {img.tags?.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-1 px-4 mt-2">
                          {img.tags.slice(0, 3).map(t => (
                            <span key={t} className="text-[7px] font-black text-white/80 bg-white/10 px-1.5 py-0.5 rounded backdrop-blur-md uppercase tracking-widest shadow-sm">#{t}</span>
                          ))}
                          {img.tags.length > 3 && <span className="text-[7px] font-black text-white/50 px-1">+{img.tags.length-3}</span>}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Actions (Floating) */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-300 z-20">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeletingImage(img.url); }}
                      className="w-8 h-8 rounded-full bg-white/95 dark:bg-slate-900/95 text-red-500 shadow-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all scale-90 hover:scale-100"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTaggingImage(img.url); }}
                      className={`w-8 h-8 rounded-full shadow-xl flex items-center justify-center transition-all scale-90 hover:scale-100 ${taggingImage === img.url ? 'bg-brand-teal text-white' : 'bg-white/95 dark:bg-slate-900/95 text-brand-dark dark:text-white hover:bg-brand-teal hover:text-white'}`}
                    >
                      <Tag size={14} />
                    </button>
                  </div>

                  {/* Deletion Confirm Overlay */}
                  <AnimatePresence>
                    {deletingImage === img.url && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[30] bg-red-500/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-4 text-white gap-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AlertCircle size={24} className="animate-bounce" />
                        <span className="text-[8px] font-black uppercase tracking-widest leading-relaxed">Radera permanent?</span>
                        <div className="flex gap-2">
                           <button onClick={() => handleDelete(img.url)} className="px-4 py-2 bg-white text-red-600 rounded-full text-[8px] font-black uppercase tracking-tighter hover:bg-gray-100 transition-colors">Ja</button>
                           <button onClick={() => setDeletingImage(null)} className="px-4 py-2 bg-white/20 text-white rounded-full text-[8px] font-black uppercase tracking-tighter border border-white/30 hover:bg-white/30 transition-colors">Nej</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tag Editor Overlay - Full height with previous compact styling */}
                  <AnimatePresence>
                    {taggingImage === img.url && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="absolute inset-0 z-[40] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 pb-5 pt-4 rounded-2xl shadow-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-[9px] font-black uppercase tracking-widest text-brand-teal">Taggar</span>
                          <button 
                            onClick={() => { setTaggingImage(null); setNewTag(""); }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar mb-4">
                          <div className="flex flex-wrap gap-1.5">
                             {img.tags.map(t => (
                               <span key={t} className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800/50 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase text-brand-dark dark:text-white border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:bg-red-50 hover:border-red-100 group/tagchip">
                                 #{t}
                                 <button 
                                   onClick={() => removeTag(img.url, img.tags, t)} 
                                   className="text-gray-400 hover:text-red-500 transition-colors"
                                 >
                                   <X size={10} />
                                 </button>
                               </span>
                             ))}
                             {img.tags.length === 0 && <span className="text-[10px] font-medium text-gray-400 italic">Inga taggar...</span>}
                          </div>
                        </div>

                        <div className="relative mt-auto">
                           <input 
                              list={`tags-list-${img.url}`}
                              autoFocus 
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addTag(img.url, img.tags)}
                              placeholder="Sök eller skapa tagg..." 
                              className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 pl-4 pr-12 py-3 rounded-xl text-[10px] font-bold outline-none focus:border-brand-teal transition-all shadow-inner dark:text-white placeholder:text-gray-400" 
                           />
                           <datalist id={`tags-list-${img.url}`}>
                             {allUniqueTags.map(tag => (
                               <option key={tag} value={tag} />
                             ))}
                           </datalist>
                           <button 
                             onClick={() => addTag(img.url, img.tags)}
                             className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-brand-teal text-white flex items-center justify-center hover:bg-brand-dark transition-all"
                           >
                             <Plus size={14} />
                           </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
