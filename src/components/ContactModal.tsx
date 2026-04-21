"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ContactTab {
  id: string;
  title: string;
  content: string;
  visible: boolean;
}

interface ContactData {
  tabs: ContactTab[];
}

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  canEdit: boolean;
}

export default function ContactModal({ isOpen, onClose, canEdit }: ContactModalProps) {
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

  const [data, setData] = useState<ContactData | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/contact");
      const json = await res.json();
      setData(json);
      if (json.tabs && json.tabs.length > 0) {
        // Find first visible tab or first tab if admin
        const initialTab = canEdit 
          ? json.tabs[0] 
          : json.tabs.find((t: ContactTab) => t.visible) || json.tabs[0];
        setActiveTabId(initialTab.id);
      }
    } catch (err) {
      console.error("Failed to fetch contact data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!data) return;
    const updatedTabs = data.tabs.map(tab => 
      tab.id === activeTabId ? { ...tab, title: editTitle, content: editContent } : tab
    );
    const newData = { ...data, tabs: updatedTabs };
    
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData)
      });
      if (res.ok) {
        setData(newData);
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to save contact data", err);
    }
  };

  const toggleVisibility = async (tabId: string) => {
    if (!data) return;
    const updatedTabs = data.tabs.map(tab => 
      tab.id === tabId ? { ...tab, visible: !tab.visible } : tab
    );
    const newData = { ...data, tabs: updatedTabs };
    
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData)
      });
      if (res.ok) {
        setData(newData);
      }
    } catch (err) {
      console.error("Failed to toggle visibility", err);
    }
  };

  const activeTab = data?.tabs.find(t => t.id === activeTabId);

  const startEditing = () => {
    if (activeTab) {
      setEditTitle(activeTab.title);
      setEditContent(activeTab.content);
      setIsEditing(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row h-[80vh] md:h-[600px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar / Tabs */}
        <div className="w-full md:w-72 bg-gray-50 dark:bg-slate-800/50 p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-800">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-brand-dark dark:text-white tracking-tight">Kontakt</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Hur kan vi hjälpa dig?</p>
          </div>

          <div className="flex-grow flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 no-scrollbar">
            {data?.tabs.map((tab) => (
              (tab.visible || canEdit) && (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTabId(tab.id); setIsEditing(false); }}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap md:whitespace-normal
                    ${activeTabId === tab.id 
                      ? "bg-brand-teal text-white shadow-lg shadow-brand-teal/20" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"}
                    ${!tab.visible && canEdit ? "opacity-60 border border-dashed border-gray-400" : ""}
                  `}
                >
                  <span className="flex items-center gap-2">
                    {tab.title}
                    {!tab.visible && canEdit && <span className="text-[10px] bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-gray-500">Dold</span>}
                  </span>
                  
                  {canEdit && (
                     <div 
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(tab.id); }}
                        className={`w-4 h-4 rounded-full border-2 transition-all ${tab.visible ? 'bg-green-500 border-green-500' : 'bg-transparent border-gray-400'}`}
                        title={tab.visible ? "Dölj flik" : "Visa flik"}
                     />
                  )}
                </button>
              )
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-grow flex flex-col relative overflow-hidden bg-white dark:bg-slate-900">
          <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
            {canEdit && !isEditing && (
              <button 
                onClick={startEditing}
                className="bg-brand-teal/10 text-brand-teal px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-teal hover:text-white transition-all shadow-sm"
              >
                Redigera
              </button>
            )}
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-brand-teal hover:text-white flex items-center justify-center text-xl font-black transition-all"
            >
              ×
            </button>
          </div>

          {isLoading ? (
            <div className="flex-grow flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin"></div>
            </div>
          ) : activeTab ? (
            <div className="flex-grow flex flex-col p-8 md:p-12 overflow-y-auto custom-scrollbar">
              {isEditing ? (
                <div className="space-y-6 flex-grow flex flex-col">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Titel</label>
                    <input 
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-brand-teal/10 font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2 flex-grow flex flex-col">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Innehåll (Markdown/Text)</label>
                    <textarea 
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      className="flex-grow w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-brand-teal/10 font-medium text-gray-700 dark:text-gray-300 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={handleSave}
                      className="flex-grow bg-brand-teal text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-brand-teal/20 hover:bg-brand-dark transition-all"
                    >
                      Spara ändringar
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="px-8 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <div className="prose dark:prose-invert max-w-none">
                  <div className="flex justify-between items-start mb-8">
                    <h3 className="text-3xl font-black text-brand-dark dark:text-white m-0 tracking-tight">{activeTab.title}</h3>
                  </div>
                  
                  <div className="space-y-4 text-gray-600 dark:text-gray-300 font-medium leading-relaxed whitespace-pre-wrap">
                    {activeTab.content}
                  </div>

                  {activeTabId === 'kontakta-oss' && (
                    <div className="mt-12 p-8 rounded-[2rem] bg-brand-teal/5 border border-brand-teal/10 flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-brand-teal flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-teal/20">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                         </svg>
                      </div>
                      <div>
                        <h4 className="font-black text-brand-dark dark:text-white text-lg">Besök oss i Lund</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Vi finns på Ideon Science Park, ett av världens främsta innovationskluster.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center text-gray-400 font-medium">
              Välj en kategori i menyn
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
