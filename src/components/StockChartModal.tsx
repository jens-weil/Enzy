"use client";

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, fromUnixTime } from 'date-fns';
import { sv } from 'date-fns/locale';

interface StockChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker?: string;
}

type TimeframeOption = {
  label: string;
  range: string;
  interval: string;
};

const timeframes: TimeframeOption[] = [
  { label: '1 dag', range: '1d', interval: '5m' },
  { label: '1 vecka', range: '5d', interval: '15m' },
  { label: '1 månad', range: '1mo', interval: '1d' },
  { label: '3 månader', range: '3mo', interval: '1d' },
  { label: '1 år', range: '1y', interval: '1d' },
  { label: '3 år', range: '3y', interval: '1wk' },
  { label: '10 år', range: '10y', interval: '1mo' },
  { label: 'Alla', range: 'max', interval: '1mo' },
];

export default function StockChartModal({ isOpen, onClose, ticker = 'ENZY.ST' }: StockChartModalProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>(timeframes[2]); // Default 1 month
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockInfo, setStockInfo] = useState({ price: 0, changePercent: 0, changeValue: 0, currency: 'SEK' });

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError('');

    fetch(`/api/stock?symbol=${ticker}&range=${selectedTimeframe.range}&interval=${selectedTimeframe.interval}`)
      .then(res => res.json())
      .then(json => {
        if (!isMounted) return;
        
        if (json.error || !json.chart || !json.chart.result) {
          setError(json.error || 'Ingen data tillgänglig');
          setLoading(false);
          return;
        }

        const result = json.chart.result[0];
        const timestamps = result.timestamp || [];
        const closes = result.indicators?.quote?.[0]?.close || [];
        const meta = result.meta;
        const prevClose = meta.previousClose || meta.chartPreviousClose;

        setStockInfo({
          price: meta.regularMarketPrice || 0,
          changePercent: meta.regularMarketPrice && prevClose ? ((meta.regularMarketPrice - prevClose) / prevClose) * 100 : 0,
          changeValue: meta.regularMarketPrice && prevClose ? (meta.regularMarketPrice - prevClose) : 0,
          currency: meta.currency || 'SEK'
        });

        const formattedData = timestamps.map((ts: number, index: number) => {
          const date = fromUnixTime(ts);
          return {
            timestamp: ts,
            date: date,
            price: closes[index] !== null ? Number(closes[index].toFixed(2)) : null,
          };
        }).filter((item: any) => item.price !== null);

        setData(formattedData);
        setLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        setError('Kunde inte ladda aktiedata');
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, [isOpen, selectedTimeframe, ticker]);

  const formatXAxis = (tickItem: Date) => {
    if (!tickItem) return '';
    if (selectedTimeframe.range === '1d' || selectedTimeframe.range === '5d') {
      return format(tickItem, 'HH:mm', { locale: sv });
    }
    if (selectedTimeframe.range === '1mo' || selectedTimeframe.range === '3mo') {
      return format(tickItem, 'd MMM', { locale: sv });
    }
    if (selectedTimeframe.range === '1y') {
      return format(tickItem, 'MMM', { locale: sv });
    }
    return format(tickItem, 'yyyy', { locale: sv });
  };

  const formatTooltipDate = (date: Date) => {
    if (!date) return '';
    if (selectedTimeframe.range === '1d' || selectedTimeframe.range === '5d') {
      return format(date, 'd MMM yyyy HH:mm', { locale: sv });
    }
    return format(date, 'd MMMM yyyy', { locale: sv });
  };

  const isPositive = stockInfo.changeValue >= 0;
  const lineColor = isPositive ? '#10B981' : '#EF4444'; // Emerald for positive, Red for negative

  // Calculate min/max for Y axis to make the chart look better
  const minPrice = data.length > 0 ? Math.min(...data.map(d => d.price)) : 0;
  const maxPrice = data.length > 0 ? Math.max(...data.map(d => d.price)) : 100;
  const padding = (maxPrice - minPrice) * 0.1;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-5xl my-auto rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h2 className="text-3xl font-black text-brand-dark dark:text-white uppercase italic tracking-tighter">
                 {ticker.split('.')[0]}
               </h2>
               <span className="px-3 py-1 rounded-full bg-brand-light text-brand-teal text-[10px] font-black uppercase tracking-widest">
                 Nasdaq First North
               </span>
            </div>
            
            <div className="flex items-end gap-4">
               <span className="text-4xl font-black italic text-brand-dark dark:text-white">
                 {stockInfo.price.toFixed(2)} <span className="text-xl text-gray-400 font-bold">{stockInfo.currency}</span>
               </span>
               <span className={`text-lg font-bold mb-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                 {isPositive ? '+' : ''}{stockInfo.changeValue.toFixed(2)} ({isPositive ? '+' : ''}{stockInfo.changePercent.toFixed(2)}%)
               </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-2xl font-black"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="px-0 md:px-8 py-6 md:py-8 space-y-8">
          {/* Timeframe Selectors */}
            <div className="flex flex-row justify-between items-center gap-1 md:gap-2 px-2 md:px-0">
              {timeframes.map((tf) => (
                <button
                  key={tf.label}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`flex-1 px-0 md:px-4 py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-tighter md:tracking-widest transition-all ${
                    selectedTimeframe.label === tf.label
                      ? 'bg-brand-teal text-white shadow-md'
                      : 'bg-gray-50 dark:bg-slate-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'
                  } ${['1 vecka', '3 månader', '10 år'].includes(tf.label) ? 'hidden sm:block' : 'block'}`}
                >
                  <span className="hidden md:inline">{tf.label}</span>
                  <span className="md:hidden">
                    {tf.label.includes(' ') ? `${tf.label.split(' ')[0]}${tf.label.split(' ')[1].charAt(0)}` : tf.label}
                  </span>
                </button>
              ))}
            </div>

          {/* Chart Area */}
          <div className="h-[400px] w-full relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-teal"></div>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-red-500 font-bold">{error}</p>
              </div>
            ) : data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={lineColor} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={lineColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-slate-800" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxis} 
                    minTickGap={30}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[minPrice - padding, maxPrice + padding]} 
                    tickFormatter={(val) => val.toFixed(1)}
                    orientation="right"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                    labelFormatter={(label) => <span className="text-xs font-black text-gray-400 tracking-widest uppercase">{formatTooltipDate(label as Date)}</span>}
                    formatter={(value: any) => [<span className="text-lg font-black text-brand-dark italic">{Number(value).toFixed(2)} kr</span>, '']}
                    separator=""
                  />
                  {stockInfo.price > 0 && selectedTimeframe.range !== 'max' && selectedTimeframe.range !== '10y' && (
                    <ReferenceLine y={data[0]?.price} stroke="#9CA3AF" strokeDasharray="3 3" />
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke={lineColor} 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: lineColor, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
