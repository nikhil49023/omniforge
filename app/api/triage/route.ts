import { NextRequest, NextResponse } from 'next/server';
import { triageDocumentation } from '@/lib/triage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { markdown, sourceUrl } = body;

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid "markdown" string is required.' },
        { status: 400 }
      );
    }

    const triageResult = triageDocumentation(markdown, sourceUrl);

    return NextResponse.json({
      success: true,
      result: triageResult,
    });
  } catch (error: any) {
    console.error('[API /api/triage] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while triaging docs.' },
      { status: 500 }
    );
  }
}
