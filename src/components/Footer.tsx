"use client";

import { useEffect, useState } from "react";
import { fetchSettingsOnce, invalidateSettingsCache } from "@/lib/settingsCache";

export default function Footer() {
  const [company, setCompany] = useState({ 
    name: "Enzymatica", 
    description: "Enzymatica utvecklar och säljer hälsoprodukter mot infektionsrelaterade sjukdomar, baserade på en barriärteknik som skyddar och förebygger." 
  });

  const loadSettings = () => {
    fetchSettingsOnce().then(data => {
      if (data?.company) {
        setCompany({
          name: data.company.name || "Enzymatica",
          description: data.company.description || "Enzymatica utvecklar och säljer hälsoprodukter mot infektionsrelaterade sjukdomar, baserade på en barriärteknik som skyddar och förebygger."
        });
      }
    }).catch(console.error);
  };

  useEffect(() => {
    loadSettings();
    window.addEventListener('settingsUpdated', loadSettings);
    return () => window.removeEventListener('settingsUpdated', loadSettings);
  }, []);

  return (
    <footer className="bg-brand-dark text-white pt-16 pb-8 border-t border-brand-teal/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-2xl font-bold tracking-tight">{company.name}</span>
            </div>
            <p className="text-brand-light/80 text-sm leading-relaxed max-w-md">
              {company.description}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-6 text-brand-cyan">Länkar</h3>
            <ul className="space-y-4 text-sm text-brand-light/80">
              <li><a href="#" className="hover:text-white transition-colors">Start</a></li>
              <li><a href="#" className="hover:text-white transition-colors">ColdZyme®</a></li>
              <li><a href="/articles" className="hover:text-white transition-colors">Artiklar & Insikter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pressmeddelanden</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-6 text-brand-cyan">Kontakt</h3>
            <ul className="space-y-4 text-sm text-brand-light/80">
              <li>Ideon Science Park</li>
              <li>223 70 Lund, Sverige</li>
              <li>info@enzymatica.com</li>
              <li>+46 (0)46 286 31 00</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-brand-light/60">
          <p>© {new Date().getFullYear()} {company.name} AB. Alla rättigheter förbehållna.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Integritetspolicy</a>
            <a href="#" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
