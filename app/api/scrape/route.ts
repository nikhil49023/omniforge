import { NextRequest, NextResponse } from 'next/server';
import { scrapeDocumentation, getFallbackDataset } from '@/lib/crawler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, forceFallback } = body;

    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'A valid "url" parameter is required.' },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();
    const result = await scrapeDocumentation(trimmedUrl, {
      forceFallback: Boolean(forceFallback),
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('[API /api/scrape] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while scraping.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sample = searchParams.get('sample') || 'stripe';
  const fallback = getFallbackDataset(sample);

  if (fallback) {
    return NextResponse.json({ success: true, result: fallback });
  }

  return NextResponse.json({
    success: true,
    availablePresets: ['stripe', 'resend', 'github', 'supabase', 'firecrawl'],
  });
}
