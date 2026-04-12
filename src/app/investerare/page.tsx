"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import StockChartModal from "../../components/StockChartModal";

type Report = {
  title: string;
  url: string;
};

type YearReports = {
  year: number;
  items: Report[];
};

type PressRelease = {
  date: string;
  title: string;
  url: string;
};

type CalendarEvent = {
  date: string;
  event: string;
};

type InvestorData = {
  stock: {
    ticker: string;
    isin: string;
    market: string;
    sector: string;
    shares: string;
    price: string;
    change: string;
  };
  reports: YearReports[];
  pressReleases: PressRelease[];
  calendar: CalendarEvent[];
};

export default function InvesterarePage() {
  const [data, setData] = useState<InvestorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] = useState(false);
  const [isStockActive, setIsStockActive] = useState(true);
  const [tickerSymbol, setTickerSymbol] = useState("ENZY.ST");
  const [sharesCount, setSharesCount] = useState("142 823 696");
  const [sectorName, setSectorName] = useState("Hälsovård");
  const [liveStock, setLiveStock] = useState<{ price: string; change: string; exchangeName: string; fullExchange: string } | null>(null);

  const fetchTickerSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const settings = await res.json();
      if (settings?.stock) {
        setTickerSymbol(settings.stock.ticker || "ENZY.ST");
        setIsStockActive(settings.stock.isActive ?? true);
        setSharesCount(settings.stock.shares || "142 823 696");
        setSectorName(settings.stock.sector || "Hälsovård");
      }
    } catch (err) {
      console.error("Failed to fetch ticker settings:", err);
    }
  };

  const fetchLiveStock = async (symbol: string) => {
    try {
      const res = await fetch(`/api/stock?symbol=${symbol}&range=1d&interval=1d`);
      const json = await res.json();
      
      if (json.chart && json.chart.result && json.chart.result.length > 0) {
        const meta = json.chart.result[0].meta;
        const price = meta.regularMarketPrice;
        const prevClose = meta.previousClose || meta.chartPreviousClose;

        if (price !== undefined && prevClose !== undefined) {
          const changePercent = ((price - prevClose) / prevClose) * 100;
          const prefix = changePercent > 0 ? "+" : "";
          setLiveStock({
            price: `${price.toFixed(2)} ${meta.currency || 'SEK'}`,
            change: `${prefix}${changePercent.toFixed(2)}%`,
            exchangeName: meta.exchangeName || 'Nasdaq',
            fullExchange: meta.fullExchangeName || 'First North'
          });
          return;
        }
      }
      throw new Error("Missing expected market data in response");
    } catch (err) {
      console.error("Failed to fetch live stock price", err);
      setLiveStock({ price: "4.28 SEK", change: "0%", exchangeName: 'Nasdaq', fullExchange: 'First North' });
    }
  };

  useEffect(() => {
    // Fetch base investor data
    fetch("/api/investors")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch investor data:", err);
        setLoading(false);
      });

    fetchTickerSettings();

    // Listen for setting updates from Admin
    const handleSettingsUpdate = () => {
      fetchTickerSettings();
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  // Fetch stock data whenever the ticker symbol changes
  useEffect(() => {
    fetchLiveStock(tickerSymbol);
  }, [tickerSymbol]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-teal"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Kunde inte ladda investerardata.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative pt-10 pb-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-brand-teal/5 to-transparent -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-teal/10 text-brand-teal text-xs font-black uppercase tracking-widest italic">
                <span className="w-2 h-2 rounded-full bg-brand-teal animate-pulse" />
                Investerare
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-brand-dark dark:text-white leading-tight uppercase italic tracking-tighter">
                Vi bygger framtiden för <span className="text-brand-teal">hälsa</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl font-medium leading-relaxed">
                Enzymatica är ett Life Science-bolag som utvecklar och säljer hälsoprodukter baserade på en barriärteknologi med marina enzymer.
              </p>

              {isStockActive && (
                <div className="flex flex-wrap gap-4 pt-4">
                  <div
                    onClick={() => setShowChart(true)}
                    className="px-8 py-5 rounded-3xl bg-brand-dark text-white shadow-2xl flex flex-col justify-center transform hover:scale-105 transition-all cursor-pointer group relative"
                  >
                    <div className="absolute top-4 right-4 text-white/30 group-hover:text-brand-teal transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-start gap-8 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Ticker</span>
                      <span className={`text-[10px] font-black uppercase ${liveStock?.change.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                        {liveStock ? liveStock.change : "..."}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black italic">{tickerSymbol.split('.')[0]}</span>
                      <span className="text-xl font-bold text-brand-teal italic">
                        {liveStock ? liveStock.price : (
                          <span className="text-sm text-brand-teal/50 animate-pulse">Hämtar...</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="px-8 py-5 rounded-3xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xl flex flex-col justify-center transform hover:scale-105 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal mb-1">
                      {liveStock?.exchangeName || 'Nasdaq'}
                    </span>
                    <span className="text-xl font-black text-brand-dark dark:text-white uppercase italic">
                      {liveStock?.fullExchange || 'First North'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 relative">
              <div className="aspect-square rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white dark:border-slate-900 relative">
                <Image
                  src="/hero_lab_researchers.png"
                  alt="Enzymatica Research"
                  fill
                  className="object-cover transform hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 to-transparent" />
                <div className="absolute bottom-10 left-10">
                  <span className="text-xs font-black text-brand-teal uppercase tracking-widest bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                    Forskning & Utveckling
                  </span>
                </div>
              </div>
              {/* Floating Stat Card */}
              {isStockActive && (
                <div className="absolute -bottom-8 -left-8 bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-slate-800 hidden lg:block">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-400 block tracking-widest">Antal aktier</span>
                      <span className="text-2xl font-black text-brand-dark dark:text-white italic">{sharesCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-gray-400 block tracking-widest">Sektor</span>
                      <span className="text-lg font-bold text-brand-teal uppercase italic">{sectorName}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Financial Reports */}
      <section className="py-10 bg-gray-50 dark:bg-brand-dark/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-16">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter">Finansiella Rapporter</h2>
              <p className="text-gray-500 font-medium">Här hittar du våra senaste kvartalsrapporter och årsredovisningar.</p>
            </div>
            <div className="h-1.5 w-32 bg-brand-teal rounded-full hidden md:block" />
          </div>

          <div className="space-y-16">
            {data.reports.map((yearGroup) => (
              <div key={yearGroup.year} className="space-y-8">
                <h3 className="text-2xl font-black text-brand-dark dark:text-white border-l-4 border-brand-teal pl-6 uppercase italic tracking-widest">
                  {yearGroup.year}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {yearGroup.items.map((report, idx) => (
                    <a
                      key={idx}
                      href={report.url}
                      target="_blank"
                      className="group bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-lg border border-transparent hover:border-brand-teal transition-all flex flex-col justify-between min-h-[220px]"
                    >
                      <div className="space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-light flex items-center justify-center text-brand-teal group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h4 className="font-black text-brand-dark dark:text-white uppercase italic text-sm leading-snug tracking-tight">
                          {report.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-black uppercase text-brand-teal tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Ladda ner PDF &rarr;
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press & Calendar Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            {/* Press Releases */}
            <div className="lg:col-span-2 space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter">Pressmeddelanden</h2>
                <div className="h-1.5 w-16 bg-brand-teal rounded-full" />
              </div>

              <div className="space-y-1">
                {data.pressReleases.map((news, idx) => (
                  <Link
                    key={idx}
                    href={news.url}
                    className="flex flex-col md:flex-row md:items-center gap-4 py-8 border-b border-gray-100 dark:border-slate-800 group hover:px-6 transition-all rounded-2xl"
                  >
                    <time className="text-[11px] font-black text-gray-400 uppercase tracking-widest italic w-32 shrink-0">
                      {news.date}
                    </time>
                    <h4 className="text-lg font-black text-brand-dark dark:text-white group-hover:text-brand-teal transition-colors uppercase italic flex-grow">
                      {news.title}
                    </h4>
                    <span className="w-8 h-8 rounded-full bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-brand-teal group-hover:text-white transition-all transform group-hover:translate-x-2">
                      &rarr;
                    </span>
                  </Link>
                ))}
              </div>

              <Link href="/articles" className="inline-flex items-center gap-4 px-10 py-5 rounded-3xl bg-brand-light text-brand-dark font-black text-xs uppercase tracking-[0.2em] hover:bg-brand-teal hover:text-white transition-all shadow-xl shadow-brand-teal/10">
                Visa alla nyheter
                <span className="text-lg">→</span>
              </Link>
            </div>

            {/* Calendar */}
            <div className="space-y-12">
              <div className="bg-brand-dark p-12 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-teal/20 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="relative z-10 space-y-10">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Kalender</h2>
                    <div className="h-1 w-12 bg-brand-teal rounded-full" />
                  </div>

                  <div className="space-y-8">
                    {data.calendar.map((item, idx) => (
                      <div key={idx} className="space-y-2 group cursor-default">
                        <span className="text-[10px] font-black text-brand-teal uppercase tracking-widest">{item.date}</span>
                        <h4 className="text-white font-black uppercase italic group-hover:translate-x-1 transition-transform">{item.event}</h4>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 space-y-6">
                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 space-y-3">
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Certified Adviser</span>
                      <p className="text-sm text-white font-bold leading-relaxed">
                        Nasdaq First North Growth Market Certified Adviser: <span className="text-brand-teal italic">Erik Penser Bank</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[4rem] bg-gradient-to-br from-brand-dark to-[#0F172A] p-16 md:p-24 overflow-hidden text-center shadow-3xl">
            <div className="absolute inset-0 bg-[url('/hero.png')] opacity-10 mix-blend-overlay grayscale" />
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-brand-dark/40 to-brand-dark" />

            <div className="relative z-10 space-y-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic leading-tight tracking-tighter">
                Vill du veta <span className="text-brand-teal underline decoration-4 underline-offset-8">mer</span> om vår resa?
              </h2>
              <p className="text-xl text-white/60 font-medium">
                Kontakta vårt investerarteam för frågor gällande bolagets utveckling och framtid.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6">
                <button
                  onClick={() => window.location.href = '/kontakt'}
                  className="px-12 py-6 rounded-3xl bg-brand-teal text-white font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-white hover:text-brand-dark transition-all transform hover:-translate-y-1"
                >
                  Kontakta oss
                </button>
                <Link
                  href="/articles"
                  className="px-12 py-6 rounded-3xl bg-white/10 text-white font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all backdrop-blur-md border border-white/10"
                >
                  Följ våra nyheter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StockChartModal isOpen={showChart} onClose={() => setShowChart(false)} ticker={tickerSymbol} />
    </div>
  );
}
