import { NextRequest, NextResponse } from 'next/server';
import { generateMcpServers, GenerationRequest } from '@/lib/groq';
import { saveProject, createShareableLink } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      endpoints,
      serverName,
      baseUrl,
      authType,
      envVarName,
      language,
      userApiKey,
      save = true,
      sourceUrl,
    } = body;

    if (!serverName || typeof serverName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'A valid "serverName" is required.' },
        { status: 400 }
      );
    }

    if (!endpoints || !Array.isArray(endpoints) || endpoints.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one endpoint is required in the "endpoints" array.' },
        { status: 400 }
      );
    }

    const genRequest: GenerationRequest = {
      endpoints,
      serverName: serverName.trim(),
      baseUrl: baseUrl?.trim(),
      authType,
      envVarName: envVarName?.trim(),
      language: language || 'both',
      userApiKey: userApiKey?.trim(),
    };

    const generated = await generateMcpServers(genRequest);

    let savedProject = null;
    let shareUrl = null;

    if (save) {
      savedProject = await saveProject({
        name: serverName.trim(),
        sourceUrl,
        endpoints,
        pythonCode: generated.pythonCode,
        typescriptCode: generated.typescriptCode,
        claudeDesktopConfig: generated.claudeDesktopConfig,
        readme: generated.readme,
        modelUsed: generated.modelUsed,
      });

      shareUrl = createShareableLink(savedProject.id);
    }

    return NextResponse.json({
      success: true,
      result: generated,
      project: savedProject,
      shareUrl,
    });
  } catch (error: any) {
    console.error('[API /api/generate] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while generating MCP code.' },
      { status: 500 }
    );
  }
}
