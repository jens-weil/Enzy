"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const heroImages = [
  {
    src: "/hero_lab_researchers.png",
    alt: "Enzymatica virusforskning laboratorium med forskare",
    headline: "Skydda dig mot",
    highlight: "infektioner"
  },
  {
    src: "/sick_person_hero.png",
    alt: "Person med förkylning och röd näsa",
    headline: "Slipp förkylningar och",
    highlight: "infektioner"
  },
  {
    src: "/hero_authentic.webp",
    alt: "Kvinna strålande frisk och fri från sin förkylning",
    headline: "Få ökad",
    highlight: "livskvalitet"
  }
];

import MembershipModal from "@/components/MembershipModal";
import { useAuth } from "@/components/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [activeImage, setActiveImage] = useState(0);
  const [showMembershipModal, setShowMembershipModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % heroImages.length);
    }, 8000); // Rotate every 8 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full h-[90vh] min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Images with Cross-Fade */}
        <div className="absolute inset-0 z-0">
          {heroImages.map((img, idx) => (
            <div 
              key={img.src}
              className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${activeImage === idx ? "opacity-100" : "opacity-0"}`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                priority={idx === 0}
                className="object-cover"
              />
            </div>
          ))}
          
          {/* Subtle Overlay to ensure text readability */}
          <div className="absolute inset-0 bg-black/40 dark:bg-slate-900/50 z-10"></div>
          {/* Gradient for a premium feel */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <span className="inline-block py-1 px-4 rounded-full bg-brand-cyan/25 backdrop-blur-sm text-white text-sm font-bold tracking-wider mb-2 border border-white/20">
            BARRIÄRTEKNIK SOM SKYDDAR
          </span>
          <h1
            className="font-black tracking-tight leading-[1.05] text-white drop-shadow-2xl my-10 relative"
            style={{ fontSize: "clamp(2.5rem, 8vw, 7rem)" }}
          >
            {heroImages.map((img, idx) => (
              <span
                key={idx}
                className={`block transition-all duration-700 ease-in-out ${
                  activeImage === idx
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-6 absolute inset-x-0"
                }`}
              >
                <span className="whitespace-nowrap">{img.headline}</span>
                <br />
                <span className="text-brand-cyan whitespace-nowrap">{img.highlight}</span>
              </span>
            ))}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto mt-0 mb-10 leading-relaxed drop-shadow-lg font-medium">
            ColdZyme® munspray skapar en skyddande barriär som verkar omedelbart mot förkylningsvirus.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 pt-4">
            {!user && (
              <button 
                onClick={() => setShowMembershipModal(true)}
                className="bg-brand-cyan hover:bg-white text-brand-dark text-xl px-10 py-4 rounded-full font-black transition-all shadow-2xl hover:shadow-cyan-500/20 transform hover:-translate-y-1 inline-block uppercase tracking-widest"
              >
                Ansök om medlemskap
              </button>
            )}
            <a href="#coldzyme" className="bg-brand-teal hover:bg-brand-dark text-white text-xl px-10 py-4 rounded-full font-bold transition-all shadow-2xl hover:shadow-cyan-500/20 transform hover:-translate-y-1 inline-block scroll-smooth text-center">
              Läs mer om ColdZyme®
            </a>
            <Link href="/articles" className="glassmorphism text-white text-xl px-10 py-4 rounded-full font-bold transition-all shadow-xl hover:bg-white/20 transform hover:-translate-y-1 text-center">
              Våra Nyheter
            </Link>
          </div>
        </div>

        {/* Abstract shapes for decoration */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-brand-cyan/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten filter opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-8 left-1/2 w-80 h-80 bg-brand-accent/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-lighten filter opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </section>

      <MembershipModal 
        isOpen={showMembershipModal} 
        onClose={() => setShowMembershipModal(false)} 
      />
      {/* ColdZyme Feature Section */}
      <section id="coldzyme" className="py-32 bg-brand-dark relative overflow-hidden group focus:outline-none scroll-mt-24">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-teal/20 to-transparent block mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative h-[600px] w-full rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 group-hover:shadow-brand-teal/20 transition-all duration-700">
              <Image 
                src="/coldzyme_family.png" 
                alt="ColdZyme Produkt Detaljer" 
                fill 
                className="object-cover transform group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-12 text-white">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-brand-teal mb-2 block drop-shadow-lg">Kliniskt Bevisad Effektivitet</span>
                <h3 className="text-4xl font-black italic drop-shadow-2xl">Minskar risken</h3>
              </div>
            </div>
            
            <div className="space-y-8">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-light text-brand-teal text-xs font-black uppercase tracking-widest italic border border-brand-teal/20 shadow-lg">
                Vår flaggskeppsprodukt
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-tight drop-shadow-xl">
                Trippelverkande <span className="text-brand-teal">Skydd</span>
              </h2>
              <div className="space-y-6 text-lg text-white/80 font-medium leading-relaxed">
                <p>
                  ColdZyme® munspray verkar lokalt direkt i munhålan och svalget där förkylningsvirus oftast får fäste. Vår unika barriärteknologi bygger på ett marint enzym (trypsin) – helt naturligt – som utvinns från djuphavstorsk.
                </p>
                <div className="space-y-6 pt-4">
                  <div className="flex items-start gap-6 group/item cursor-default">
                    <span className="w-10 h-10 rounded-full bg-brand-teal/20 text-brand-teal flex items-center justify-center font-black shrink-0 mt-1 shadow-inner group-hover/item:bg-brand-teal group-hover/item:text-white transition-all">1</span>
                    <div>
                        <strong className="text-white block text-xl mb-1">Fångar virus</strong>
                        <span className="text-sm">Skapar en skyddande barriär på slemhinnan i halsen som aktivt binder och fångar in elakartade viruspartiklar.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-6 group/item cursor-default">
                    <span className="w-10 h-10 rounded-full bg-brand-teal/20 text-brand-teal flex items-center justify-center font-black shrink-0 mt-1 shadow-inner group-hover/item:bg-brand-teal group-hover/item:text-white transition-all">2</span>
                    <div>
                        <strong className="text-white block text-xl mb-1">Deaktiverar virus</strong>
                        <span className="text-sm">Vårt patenterade marina enzym bryter ned och förstör virusets förmåga att infektera friska mänskliga celler.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-6 group/item cursor-default">
                    <span className="w-10 h-10 rounded-full bg-brand-teal/20 text-brand-teal flex items-center justify-center font-black shrink-0 mt-1 shadow-inner group-hover/item:bg-brand-teal group-hover/item:text-white transition-all">3</span>
                    <div>
                        <strong className="text-white block text-xl mb-1">Skyddar svalget</strong>
                        <span className="text-sm">Lindrar befintliga symtom, kan dokumenterat förkorta sjukdomsperioden avsevärt, och verkar förebyggande.</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-10">
                <a 
                  href="https://www.coldzyme.se/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-6 bg-brand-teal hover:bg-white text-white hover:text-brand-dark text-lg px-12 py-6 rounded-full font-black uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(20,184,166,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.4)] transform hover:-translate-y-1"
                >
                  Utforska på ColdZyme.se
                  <span className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center leading-none text-2xl transition-transform group-hover:translate-x-2">&rarr;</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-dark dark:text-white">
                Oberoende studieresultat
              </h2>
              <div className="space-y-6">
                <div className="p-6 bg-brand-light/50 dark:bg-slate-900 rounded-2xl border border-brand-teal/10">
                  <h3 className="text-xl font-semibold text-brand-dark dark:text-brand-cyan mb-3">
                    ColdZyme® minskar förkylningstiden
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    En vetenskaplig artikel publicerad i Journal of Physiology, bekräftar att ColdZyme® inte bara lindrar förkylningssymtom, utan angriper den underliggande orsaken.
                  </p>
                </div>
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                  <h3 className="text-xl font-semibold text-brand-dark dark:text-brand-cyan mb-3">
                    Banbrytande nya studier
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Professor Davison och professor Wilflingseder presenterar oberoende studieresultat publicerade i The Journal of Physiology.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative h-[600px] w-full bg-slate-100 dark:bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-slate-800 transform hover:scale-[1.02] transition-all duration-500">
              <Image 
                src="/product_presentation.png" 
                alt="ColdZyme Produktpresentation" 
                fill 
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-12 text-white">
                <span className="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-2 block">Premium Barriärteknik</span>
                <h3 className="text-2xl font-bold">ColdZyme® Skyddsteknik</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
