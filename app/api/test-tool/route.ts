import { NextRequest, NextResponse } from 'next/server';
import { ExtractedEndpoint } from '@/lib/triage';

export async function POST(req: NextRequest) {
  const startTime = performance.now();
  try {
    const body = await req.json();
    const {
      endpoint,
      params = {},
      baseUrl,
      authHeader,
      simulate = true,
    } = body as {
      endpoint: ExtractedEndpoint;
      params: Record<string, any>;
      baseUrl?: string;
      authHeader?: string;
      simulate?: boolean;
    };

    if (!endpoint || !endpoint.method || !endpoint.path) {
      return NextResponse.json(
        { success: false, error: 'A valid "endpoint" object with method and path is required.' },
        { status: 400 }
      );
    }

    // Parameter validation against schema
    const validationErrors: string[] = [];
    if (endpoint.parameters && Array.isArray(endpoint.parameters)) {
      for (const p of endpoint.parameters) {
        if (p.required && (params[p.name] === undefined || params[p.name] === null || params[p.name] === '')) {
          validationErrors.push(`Missing required parameter: "${p.name}"`);
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json({
        success: false,
        validationErrors,
        error: `Validation failed: ${validationErrors.join(', ')}`,
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
      }, { status: 422 });
    }

    // Build effective target URL
    const targetBase = (baseUrl || 'https://api.example.com').replace(/\/$/, '');
    let resolvedPath = endpoint.path;

    for (const [key, val] of Object.entries(params)) {
      resolvedPath = resolvedPath
        .replace(`{${key}}`, encodeURIComponent(String(val)))
        .replace(`:${key}`, encodeURIComponent(String(val)));
    }

    const fullUrl = `${targetBase}${resolvedPath}`;

    // If sandbox / simulation mode (default):
    if (simulate || !baseUrl || baseUrl.includes('example.com')) {
      const simulatedData: Record<string, any> = {
        status: 'simulated_success',
        endpoint: `${endpoint.method} ${endpoint.path}`,
        tool: endpoint.name,
        timestamp: new Date().toISOString(),
        echoParameters: params,
        simulatedResponse: {
          id: `sim_${Math.random().toString(36).substring(2, 9)}`,
          object: endpoint.name.replace(/^(create|get|list|update|delete)_/, ''),
          created: Math.floor(Date.now() / 1000),
          livemode: false,
          ...params,
        },
      };

      return NextResponse.json({
        success: true,
        simulated: true,
        request: {
          method: endpoint.method,
          url: fullUrl,
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: endpoint.method !== 'GET' ? params : undefined,
        },
        response: {
          status: 200,
          statusText: 'OK (OmniForge Sandbox)',
          data: simulatedData,
        },
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
      });
    }

    // Live Execution Mode (when valid live baseUrl is provided)
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const queryParams = new URLSearchParams();
    if (endpoint.method === 'GET') {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && !endpoint.path.includes(`{${k}}`)) {
          queryParams.append(k, String(v));
        }
      }
    }

    const queryString = queryParams.toString();
    const finalUrl = queryString ? `${fullUrl}?${queryString}` : fullUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const liveRes = await fetch(finalUrl, {
      method: endpoint.method,
      headers,
      body: endpoint.method !== 'GET' ? JSON.stringify(params) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = liveRes.headers.get('content-type') || '';
    const resData = contentType.includes('application/json')
      ? await liveRes.json()
      : await liveRes.text();

    return NextResponse.json({
      success: liveRes.ok,
      simulated: false,
      request: {
        method: endpoint.method,
        url: finalUrl,
        headers,
      },
      response: {
        status: liveRes.status,
        statusText: liveRes.statusText,
        data: resData,
      },
      latencyMs: Number((performance.now() - startTime).toFixed(2)),
    });
  } catch (error: any) {
    console.error('[API /api/test-tool] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error occurred while executing test tool.',
        latencyMs: Number((performance.now() - startTime).toFixed(2)),
      },
      { status: 500 }
    );
  }
}
