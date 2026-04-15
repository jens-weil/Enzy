"use client";

import { useState, useEffect } from "react";
import StockChartModal from "./StockChartModal";

interface StockTickerProps {
  onOpenChart: () => void;
  ticker?: string;
  className?: string;
}

export default function StockTicker({ onOpenChart, ticker = 'ENZY.ST', className }: StockTickerProps) {
  const [liveStock, setLiveStock] = useState<{ price: string; change: string; isNegative: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStock = () => {
      setLoading(true);
      fetch(`/api/stock?symbol=${ticker}&range=1d&interval=5m`)
        .then(res => res.json())
        .then(json => {
          // Check if the backend returned an error object (even with status 200)
          if (json.error) {
            throw new Error(`API Error: ${json.error}`);
          }

          if (json.chart && json.chart.result && json.chart.result.length > 0) {
            const result = json.chart.result[0];
            const meta = result.meta;
            const price = meta.regularMarketPrice;
            const prevClose = meta.previousClose || meta.chartPreviousClose;

            if (price !== undefined && prevClose !== undefined) {
              const changePercent = ((price - prevClose) / prevClose) * 100;
              const prefix = changePercent > 0 ? "+" : "";
              setLiveStock({
                price: `${price.toFixed(2)} ${meta.currency || 'SEK'}`,
                change: `${prefix}${changePercent.toFixed(2)}%`,
                isNegative: changePercent < 0
              });
              setLoading(false);
              return;
            }
          }
          throw new Error("Stock data missing or malformed");
        })
        .catch(err => {
          // Log only if it's a real unexpected error, not just the service being down
          if (!err.message.includes("API Error")) {
             console.error("Stock fetch error:", err.message);
          }
          // Fallback to static data if API fails
          setLiveStock({ price: "4.30 SEK", change: "+0.47%", isNegative: false });
          setLoading(false);
        });
    };

    fetchStock();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStock, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [ticker]);

  const displaySymbol = ticker.split('.')[0];

  return (
    <button
      onClick={onOpenChart}
      className={`${className || ""} flex-col items-center justify-center px-4 py-1.5 rounded-2xl bg-slate-300 text-slate-900 shadow-lg hover:scale-105 transition-all group border border-slate-400 h-[45px] min-w-[100px]`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="italic text-brand-teal text-[13px] font-black uppercase tracking-widest">{displaySymbol}</span>
        <svg className="w-2.5 h-2.5 text-gray-400 group-hover:text-brand-teal transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18" />
        </svg>
      </div>
      <div className="flex items-center gap-2 text-[11px] font-bold">
        {loading ? (
          <div className="w-12 h-2 bg-slate-400 animate-pulse rounded-full" />
        ) : (
          <>
            <span className="tabular-nums">{liveStock?.price.split(' ')[0]}</span>
            <span className={liveStock?.isNegative ? "text-red-600" : "text-green-700"}>
              {liveStock?.change}
            </span>
          </>
        )}
      </div>
    </button>
  );
}
