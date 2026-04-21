"use client";

import { useState, useEffect, useRef } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format, fromUnixTime } from 'date-fns';
import { sv } from 'date-fns/locale';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { Lock, ArrowRight, Maximize2, Minimize2 } from 'lucide-react';
import MembershipModal from './MembershipModal';

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

  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>(timeframes[2]); // Default 1 month
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockInfo, setStockInfo] = useState({ price: 0, changePercent: 0, changeValue: 0, currency: 'SEK', exchangeName: 'Stockholm' });
  const [lastFetchedTicker, setLastFetchedTicker] = useState('');
  
  // Chart View States
  const [showLog, setShowLog] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [showMA30, setShowMA30] = useState(false);
  const [showMA100, setShowMA100] = useState(false);
  const [showOHLC, setShowOHLC] = useState(false);
  const [showTimeframeOpen, setShowTimeframeOpen] = useState(false);
  const [showSettingsOpen, setShowSettingsOpen] = useState(false);
  const [hasInitialFetchStarted, setHasInitialFetchStarted] = useState(false);

  // RBAC states
  const { profile } = useAuth();
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState<string>("Medlem");
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const role = profile?.role || "Anonym";
  
  // Role helpers
  const isAdminOrEditor = ["Admin", "Redaktör", "Editor"].includes(role);
  const isInvestor = isAdminOrEditor || ["Investerare", "Investor"].includes(role);
  const isMember = isInvestor || ["Medlem", "Regular", "Partner", "Säljare", "Sales"].includes(role);
  const isAnon = role === "Anonym";

  // Transient message helper
  const triggerAccessMessage = (msg: string, role: string = "Medlem") => {
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    setAccessMessage(msg);
    setTargetRole(role);
    messageTimeoutRef.current = setTimeout(() => setAccessMessage(null), 5000);
  };

  const handleTimeframeSelect = (tf: TimeframeOption) => {
    const isLongTerm = ['1y', '3y', '10y', 'max'].includes(tf.range);
    
    if (isLongTerm && !isMember) {
      triggerAccessMessage("Längre historik kräver Medlemskap. Logga in eller ansök för att låsa upp.", "Medlem");
      return;
    }
    
    setSelectedTimeframe(tf);
    setShowTimeframeOpen(false);
  };

  const handleIndicatorToggle = (indicator: string, current: boolean, setter: (val: boolean) => void) => {
    if (indicator === 'ohlc' || indicator === 'log') {
      if (!isMember) {
        triggerAccessMessage("Denna funktion kräver att du är Medlem.", "Medlem");
        return;
      }
    }

    if (indicator === 'ma30' || indicator === 'ma100') {
      if (!isInvestor) {
        triggerAccessMessage("Teknisk analys (MA) kräver rollen Investerare.", "Investerare");
        return;
      }
    }

    setter(!current);
  };

  // Helper to fetch and process data
  const fetchStockData = async (tf: TimeframeOption, isMounted: boolean) => {
    try {
      if (isMounted) setLoading(true);
      setError('');

      // Determine interval: use 1d for 3mo+ views if MA is active for accuracy
      let intervalToUse = tf.interval;
      if ((showMA30 || showMA100) && ['3mo', '1y', '3y', '10y', 'max'].includes(tf.range)) {
        intervalToUse = '1d';
      }

      const res = await fetch(`/api/stock?symbol=${ticker}&range=${tf.range}&interval=${intervalToUse}`);
      const json = await res.json();
      
      if (!isMounted) return;
      
      if (json.error || !json.chart || !json.chart.result) {
        setError(json.error || 'Ingen data tillgänglig');
        setLoading(false);
        return;
      }

      const result = json.chart.result[0];
      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};
      const closes = quote.close || [];
      const opens = quote.open || [];
      const highs = quote.high || [];
      const lows = quote.low || [];
      const volumes = quote.volume || [];
      const meta = result.meta;
      const prevClose = meta.previousClose || meta.chartPreviousClose;

      setStockInfo({
        price: meta.regularMarketPrice || 0,
        changePercent: meta.regularMarketPrice && prevClose ? ((meta.regularMarketPrice - prevClose) / prevClose) * 100 : 0,
        changeValue: meta.regularMarketPrice && prevClose ? (meta.regularMarketPrice - prevClose) : 0,
        currency: meta.currency || 'SEK',
        exchangeName: meta.fullExchangeName || meta.exchangeName || 'Stockholm'
      });
      setLastFetchedTicker(ticker);

      // Format and compute indicators
      const formattedData = timestamps.map((ts: number, index: number) => {
        const date = fromUnixTime(ts);
        const price = closes[index] !== null ? Number(closes[index].toFixed(2)) : null;
        
        return {
          timestamp: ts,
          date: date,
          price: price,
          open: opens[index] !== null ? Number(opens[index].toFixed(2)) : price,
          high: highs[index] !== null ? Number(highs[index].toFixed(2)) : price,
          low: lows[index] !== null ? Number(lows[index].toFixed(2)) : price,
          close: price,
          volume: volumes[index] || 0,
          ohl_range: [
            lows[index] !== null ? Number(lows[index].toFixed(2)) : price,
            highs[index] !== null ? Number(highs[index].toFixed(2)) : price
          ],
        };
      }).filter((item: any) => item.price !== null);

      // Simple Moving Average Calculation
      const calculateSMA = (dataList: any[], period: number) => {
        return dataList.map((point, index) => {
          if (index < period - 1) return null;
          const slice = dataList.slice(index - period + 1, index + 1);
          const sum = slice.reduce((acc, curr) => acc + (curr.price || 0), 0);
          return Number((sum / period).toFixed(2));
        });
      };

      const ma30Values = calculateSMA(formattedData, 30);
      const ma100Values = calculateSMA(formattedData, 100);

      const dataWithIndicators = formattedData.map((d: any, i: number) => ({
        ...d,
        ma30: ma30Values[i],
        ma100: ma100Values[i],
      }));

      setData(dataWithIndicators);
      setLoading(false);
    } catch (err) {
      if (!isMounted) return;
      setError('Kunde inte ladda aktiedata');
      setLoading(false);
    }
  };

  // Background Pre-fetch on Mount
  useEffect(() => {
    let isMounted = true;
    
    const preFetch = () => {
      if (data.length > 0) return; // Already have data
      fetchStockData(selectedTimeframe, isMounted);
      setHasInitialFetchStarted(true);
    };

    // Delay slightly to not block initial page load
    const timeout = setTimeout(preFetch, 2000);
    
    return () => { 
      isMounted = false;
      clearTimeout(timeout);
    };
  }, []);

  // Manual timeframe changes or when opened
  useEffect(() => {
    if (!isOpen) return;

    // If ticker changed, clear old data first to avoid flickering
    if (lastFetchedTicker !== ticker) {
      setData([]);
    }

    let isMounted = true;
    fetchStockData(selectedTimeframe, isMounted);

    return () => { isMounted = false; };
  }, [isOpen, selectedTimeframe, ticker, showMA30, showMA100]);

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

  // Calculate min/max for Y axis
  const minPrice = data.length > 0 ? Math.min(...data.map(d => d.price || 999999)) : 0;
  const maxPrice = data.length > 0 ? Math.max(...data.map(d => d.price || 0)) : 100;
  const padding = (maxPrice - minPrice) * 0.1;

  // Custom Candlestick Component for OHLC
  const Candlestick = (props: any) => {
    const { x, y, width, height, low, high, open, close } = props;
    const isUp = close >= open;
    const color = isUp ? '#10B981' : '#EF4444';
    
    // x is the center of the bar, we need to draw relative to it
    const centerX = x + width / 2;
    const candleWidth = Math.max(width * 0.6, 2);

    return (
      <g>
        {/* Wick */}
        <line
          x1={centerX}
          y1={y + height * (1 - (high - low) / (high - low))} // This logic is handled by Bar's coordinate system
          x2={centerX}
          y2={y + height}
          stroke={color}
          strokeWidth={1}
        />
        {/* Simplified high-low line using the mapped props from Recharts */}
        {/* Recharts Bar actually maps the 'price' to height, but for OHLC we use it differently */}
      </g>
    );
  };

  // Improved Candlestick using a more reliable approach for Recharts
  const renderCandlestick = (props: any) => {
    const { x, y, width, index, data } = props;
    const item = data[index];
    if (!item) return null;

    const { open, close, high, low } = item;
    const isUp = close >= open;
    const color = isUp ? '#10B981' : '#EF4444';

    // We need to map the price values to Y coordinates
    // Recharts doesn't pass the Y scale directly to shapes easily, 
    // but we can use the 'y' and 'height' from the Bar since we pass [low, high] as data
    const centerX = x + width / 2;
    const candleWidth = Math.max(width - 2, 1);
    
    // The 'y' and 'height' here represent the High and Low because we pass [low, high] to the Bar
    const entryTop = Math.min(open, close);
    const entryBottom = Math.max(open, close);
    
    // We'll use a simpler rendering: a thin line for high/low and a box for open/close
    // To get the exact Y, we rely on Recharts projection
    // But since this is tricky in a raw functional component without the scale, 
    // let's use a simpler "OHLC" bar styling using standard Recharts logic.
    return null;
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300 ${isMaximized ? 'p-0' : 'p-4 md:p-10'}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div 
        layout
        className={`bg-white dark:bg-slate-900 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col rounded-none ${
          isMaximized 
            ? 'w-full h-full max-w-none max-h-none' 
            : 'w-full max-w-[95vw] md:max-w-7xl h-[85vh] max-h-[1000px]'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="p-3 md:p-5 pb-4 md:pb-6 bg-gradient-to-br from-brand-teal/20 to-transparent relative border-b border-gray-50 dark:border-slate-800/50">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg md:text-2xl font-black text-brand-dark dark:text-white italic uppercase tracking-tighter mb-1">
                {ticker.split('.')[0]} <span className="text-brand-teal text-sm md:text-base font-medium opacity-50 not-italic ml-2">({stockInfo.exchangeName})</span>
              </h2>
              <div className="flex items-center gap-2 md:gap-4 flex-wrap">
                <span className="text-2xl md:text-4xl font-black text-brand-dark dark:text-white tracking-tighter">
                  {stockInfo.price.toFixed(2)} <span className="text-sm md:text-lg font-medium text-gray-400 ml-1">{stockInfo.currency}</span>
                </span>
                <span className={`text-xs md:text-base font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {isPositive ? '+' : ''}{stockInfo.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-all"
                title={isMaximized ? "Minimera" : "Maximera"}
              >
                {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              <button 
                onClick={onClose}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-xl md:text-2xl font-black"
              >
                &times;
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pl-[6px] pr-4 md:px-8 py-3 md:py-8 space-y-3 md:space-y-6 overflow-hidden flex-1 flex flex-col">
          {/* Controls Row */}
          <div className="flex flex-wrap gap-2 md:gap-4 items-center shrink-0">
            {/* Timeframe Dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowTimeframeOpen(!showTimeframeOpen); setShowSettingsOpen(false); }}
                className="px-2 md:px-6 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 flex items-center gap-2 md:gap-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all min-w-[130px] md:min-w-[160px] group text-ellipsis overflow-hidden"
              >
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Period:</span>
                <span className="text-brand-dark dark:text-white text-xs font-black uppercase tracking-widest italic">{selectedTimeframe.label}</span>
                <span className={`ml-auto text-brand-teal transition-transform duration-300 ${showTimeframeOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              <AnimatePresence>
                {showTimeframeOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTimeframeOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-3 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 py-2 z-20 overflow-hidden"
                    >
                      {timeframes.map((tf) => {
                        const isLocked = ['1y', '3y', '10y', 'max'].includes(tf.range) && !isMember;
                        return (
                          <button
                            key={tf.label}
                            onClick={() => handleTimeframeSelect(tf)}
                            className={`w-full px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-between ${
                              selectedTimeframe.label === tf.label
                                ? 'bg-brand-teal text-white'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-brand-teal'
                            }`}
                          >
                            {tf.label}
                            {isLocked && <Lock size={10} className="text-gray-400" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Indicators/Settings Dropdown */}
            <div className="relative ml-0 md:ml-2">
              <button
                onClick={() => { setShowSettingsOpen(!showSettingsOpen); setShowTimeframeOpen(false); }}
                className="px-2 md:px-6 py-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-800 flex items-center gap-2 md:gap-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all min-w-[130px] md:min-w-[160px] group text-ellipsis overflow-hidden"
              >
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Visa:</span>
                <span className="text-brand-dark dark:text-white text-xs font-black uppercase tracking-widest italic">
                  {[showLog, showVolume, showMA30, showMA100, showOHLC].filter(Boolean).length || 'Inga'} aktiva
                </span>
                <span className={`ml-auto text-brand-teal transition-transform duration-300 ${showSettingsOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              <AnimatePresence>
                {showSettingsOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSettingsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-gray-100 dark:border-slate-800 p-4 z-20 space-y-4"
                    >
                      <label className="flex items-center justify-between cursor-pointer group" onClick={(e) => { e.preventDefault(); handleIndicatorToggle('ohlc', showOHLC, setShowOHLC); }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-brand-teal">OHLC (Candles)</span>
                          {!isMember && <Lock size={10} className="text-gray-400" />}
                        </div>
                        <div className="relative">
                          <input type="checkbox" checked={showOHLC} readOnly className="sr-only" />
                          <div className={`w-8 h-4 rounded-full transition-colors ${showOHLC ? 'bg-brand-teal' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showOHLC ? 'translate-x-4' : ''}`}></div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer group" onClick={(e) => { e.preventDefault(); handleIndicatorToggle('log', showLog, setShowLog); }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-brand-teal">Logaritmisk</span>
                          {!isMember && <Lock size={10} className="text-gray-400" />}
                        </div>
                        <div className="relative">
                          <input type="checkbox" checked={showLog} readOnly className="sr-only" />
                          <div className={`w-8 h-4 rounded-full transition-colors ${showLog ? 'bg-brand-teal' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showLog ? 'translate-x-4' : ''}`}></div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer group" onClick={(e) => { e.preventDefault(); handleIndicatorToggle('vol', showVolume, setShowVolume); }}>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-brand-teal">Volym</span>
                        <div className="relative">
                          <input type="checkbox" checked={showVolume} readOnly className="sr-only" />
                          <div className={`w-8 h-4 rounded-full transition-colors ${showVolume ? 'bg-brand-teal' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showVolume ? 'translate-x-4' : ''}`}></div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer group" onClick={(e) => { e.preventDefault(); handleIndicatorToggle('ma30', showMA30, setShowMA30); }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-orange-500">MA30</span>
                          {!isInvestor && <Lock size={10} className="text-gray-400" />}
                        </div>
                        <div className="relative">
                          <input type="checkbox" checked={showMA30} readOnly className="sr-only" />
                          <div className={`w-8 h-4 rounded-full transition-colors ${showMA30 ? 'bg-orange-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showMA30 ? 'translate-x-4' : ''}`}></div>
                        </div>
                      </label>

                      <label className="flex items-center justify-between cursor-pointer group" onClick={(e) => { e.preventDefault(); handleIndicatorToggle('ma100', showMA100, setShowMA100); }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-purple-500">MA100</span>
                          {!isInvestor && <Lock size={10} className="text-gray-400" />}
                        </div>
                        <div className="relative">
                          <input type="checkbox" checked={showMA100} readOnly className="sr-only" />
                          <div className={`w-8 h-4 rounded-full transition-colors ${showMA100 ? 'bg-purple-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                          <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showMA100 ? 'translate-x-4' : ''}`}></div>
                        </div>
                      </label>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>


          {/* Chart Section */}
          <div className="w-full flex-1 min-h-[300px] relative">
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
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                    yAxisId="price"
                    orientation="right"
                    scale={showLog ? 'log' : 'linear'}
                    domain={showLog ? ['dataMin', 'dataMax'] : [minPrice - padding, maxPrice + padding]} 
                    tickFormatter={(val) => val.toFixed(1)}
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickMargin={10}
                    axisLine={false}
                    tickLine={false}
                    allowDataOverflow={true}
                  />
                  <YAxis 
                    yAxisId="volume"
                    axisLine={false}
                    tick={false}
                    hide={true}
                    domain={['auto', (max: number) => max * 5]} 
                  />
                  
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '16px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                    itemStyle={{ padding: '2px 0' }}
                    labelFormatter={(label) => <span className="text-xs font-black text-gray-400 tracking-widest uppercase">{formatTooltipDate(label as Date)}</span>}
                    formatter={(value: any, name: any) => {
                      if (name === 'price') return [<span key="price" className="text-lg font-black text-brand-dark italic">{Number(value).toFixed(2)} kr</span>, 'Pris'];
                      if (name === 'volume') return [<span key="vol" className="text-sm font-bold text-gray-500">{Number(value).toLocaleString('sv-SE')} st</span>, 'Volym'];
                      if (name === 'ma30') return [<span key="ma30" className="text-sm font-bold text-orange-500">{Number(value).toFixed(2)} kr</span>, 'MA30'];
                      if (name === 'ma100') return [<span key="ma100" className="text-sm font-bold text-purple-500">{Number(value).toFixed(2)} kr</span>, 'MA100'];
                      return [value, name];
                    }}
                    separator=""
                  />

                  {stockInfo.price > 0 && selectedTimeframe.range !== 'max' && selectedTimeframe.range !== '10y' && (
                    <ReferenceLine yAxisId="price" y={data[0]?.price} stroke="#9CA3AF" strokeDasharray="3 3" />
                  )}

                  {showVolume && (
                    <Bar 
                      yAxisId="volume"
                      dataKey="volume" 
                      fill="#9CA3AF" 
                      opacity={0.2}
                      radius={[4, 4, 0, 0]}
                    />
                  )}

                  {showMA30 && (
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="ma30" 
                      stroke="#F97316" 
                      strokeWidth={2}
                      dot={false}
                      animationDuration={300}
                    />
                  )}

                   {showMA100 && (
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="ma100" 
                      stroke="#A855F7" 
                      strokeWidth={2}
                      dot={false}
                      animationDuration={300}
                    />
                  )}

                  {showOHLC ? (
                    <Bar
                      yAxisId="price"
                      dataKey="ohl_range"
                      shape={(props: any) => {
                        const { x, y, width, height, index } = props;
                        const item = data[index];
                        if (!item) return null;
                        
                        const isUp = item.close >= item.open;
                        const color = isUp ? '#10B981' : '#EF4444';
                        const centerX = x + width / 2;
                        
                        const range = item.high - item.low;
                        if (range <= 0) return <line x1={centerX} y1={y} x2={centerX} y2={y+height} stroke={color} />;
                        
                        const bodyTop = (Math.max(item.open, item.close) - item.low) / range;
                        const bodyBottom = (Math.min(item.open, item.close) - item.low) / range;
                        
                        const bodyY = y + height * (1 - bodyTop);
                        const bodyH = Math.max(height * (bodyTop - bodyBottom), 1);
                        
                        return (
                          <g>
                            <line x1={centerX} y1={y} x2={centerX} y2={y + height} stroke={color} strokeWidth={1} />
                            <rect 
                              x={centerX - Math.max(width/3, 1)} 
                              y={bodyY} 
                              width={Math.max(width/1.5, 2)} 
                              height={bodyH} 
                              fill={color} 
                            />
                          </g>
                        );
                      }}
                    />
                  ) : (
                    <Line 
                      yAxisId="price"
                      type="monotone" 
                      dataKey="price" 
                      stroke={lineColor} 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: lineColor, strokeWidth: 0 }}
                      animationDuration={300}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            ) : null}

            {/* Access Message Notification */}
            <AnimatePresence>
              {accessMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-brand-dark/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 z-[300]"
                >
                  <Lock size={16} className="text-brand-teal shrink-0" />
                  <span className="text-white text-[11px] font-black uppercase tracking-widest italic">{accessMessage}</span>
                  <button
                    onClick={() => { setShowMembershipModal(true); setAccessMessage(null); }}
                    className="ml-2 px-4 py-1.5 bg-brand-teal text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-white hover:text-brand-teal transition-all flex items-center gap-2 group/btn"
                  >
                    {targetRole === "Investerare" ? "Ansök nu" : "Bli Medlem"}
                    <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      <MembershipModal 
        isOpen={showMembershipModal} 
        onClose={() => setShowMembershipModal(false)} 
        initialRole={targetRole}
      />
    </div>
  );
}
