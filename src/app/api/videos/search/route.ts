import { NextResponse } from 'next/server';

// Mock data for fallback
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const service = searchParams.get('service') || 'youtube';

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  // In a real implementation, we would use API keys here.
  // For now, we return mock data that "filters" by query if it matches part of the title.
  const allVideos = MOCK_VIDEOS[service as keyof typeof MOCK_VIDEOS] || [];
  const results = allVideos.filter(v => v.title.toLowerCase().includes(query.toLowerCase()));

  // If no results from mock, just return the mock list for demonstration
  const finalResults = results.length > 0 ? results : allVideos;

  return NextResponse.json({ results: finalResults });
}
