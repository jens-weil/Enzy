import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || '1mo';
  const interval = searchParams.get('interval') || '1d';
  const symbol = searchParams.get('symbol') || 'ENZY.ST';

  try {
    // query2 is often more reliable for newer chart data
    const apiUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    console.log(`Fetching stock data from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      next: { revalidate: 300 }, // Cache for 5 minutes
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Yahoo Finance API returned non-ok status (${response.status}): ${errorText.substring(0, 100)}`);
      
      // If Yahoo is failing, return a graceful error object instead of HTTP 500 
      // This allows the client-side fallback to take over without triggering console errors
      return NextResponse.json({ 
        error: 'External API Error',
        status: response.status,
        chart: { result: null, error: { code: "NOT_FOUND", description: "Symbol not found or API blocked" } } 
      });
    }

    const data = await response.json();
    
    if (data.chart?.error) {
      console.error("Yahoo Finance returned internal error in JSON:", data.chart.error);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in stock API route:", error);
    // Return a 200 with error info so the client doesn't throw on the network request
    return NextResponse.json({ 
      error: 'Unexpected Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}
