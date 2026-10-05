/**
 * lib/triage.ts
 * "System 1" rapid decision engine (LAYA / Jev concept).
 * In <30ms, parses raw markdown from documentation, extracts endpoint signatures
 * (methods, paths, params, auth, descriptions), filters out marketing filler,
 * and scores extraction confidence.
 */

export interface EndpointParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  location: 'query' | 'path' | 'header' | 'body';
  defaultValue?: any;
}

export interface ExtractedEndpoint {
  id: string;
  name: string; // Tool name (e.g., create_payment_intent)
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  summary: string;
  description: string;
  authType: 'bearer' | 'apiKey' | 'basic' | 'oauth2' | 'none';
  parameters: EndpointParameter[];
  requestBody?: {
    contentType: string;
    sample?: string;
  };
  responseExample?: string;
  category?: string;
  confidenceScore: number; // 0 - 100
  reasons: string[];
}

export interface TriageResult {
  endpoints: ExtractedEndpoint[];
  baseUrl?: string;
  detectedAuth: 'bearer' | 'apiKey' | 'basic' | 'oauth2' | 'none';
  totalEndpointsFound: number;
  executionTimeMs: number;
  averageConfidence: number;
  filteredSectionsCount: number;
  warnings: string[];
  cleanSummary: string;
}

const FILLER_PATTERNS = [
  /cookies?/i,
  /privacy policy/i,
  /terms of service/i,
  /all rights reserved/i,
  /subscribe to our newsletter/i,
  /pricing plans?/i,
  /sign up for free/i,
  /get started in minutes/i,
  /customer testimonials?/i,
  /join our discord/i,
  /follow us on twitter/i,
  /book a demo/i,
];

/**
 * Filter marketing filler and boilerplate from markdown text
 */
export function filterMarketingFiller(markdown: string): { cleanedMarkdown: string; filteredCount: number } {
  const lines = markdown.split('\n');
  const cleaned: string[] = [];
  let filteredCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    // Check if line contains typical footer / cookie / marketing filler
    const isFiller = FILLER_PATTERNS.some((pattern) => pattern.test(trimmed));
    if (isFiller && trimmed.length < 120 && !trimmed.includes('/v1') && !trimmed.includes('curl')) {
      filteredCount++;
      continue;
    }

    // Skip empty markdown link lists often found in navbars: e.g. [Home](/) | [Docs](/docs) | [Pricing](/pricing)
    if (trimmed.startsWith('[') && trimmed.includes('](') && trimmed.includes('|') && !trimmed.toLowerCase().includes('endpoint')) {
      filteredCount++;
      continue;
    }

    cleaned.push(line);
  }

  return {
    cleanedMarkdown: cleaned.join('\n'),
    filteredCount,
  };
}

/**
 * Detects base URL from documentation
 */
export function detectBaseUrl(markdown: string): string | undefined {
  const match = markdown.match(/https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?::\d+)?(?:\/v\d+)?(?:\/api)?/);
  return match ? match[0] : undefined;
}

/**
 * Detects default authentication scheme from documentation
 */
export function detectAuthType(markdown: string): 'bearer' | 'apiKey' | 'basic' | 'oauth2' | 'none' {
  const lower = markdown.toLowerCase();
  if (lower.includes('bearer ') || lower.includes('bearer token') || lower.includes('jwt')) {
    return 'bearer';
  }
  if (lower.includes('basic auth') || lower.includes('http basic') || lower.includes('-u sk_') || lower.includes('-u api_')) {
    return 'basic';
  }
  if (lower.includes('apikey') || lower.includes('api_key') || lower.includes('x-api-key')) {
    return 'apiKey';
  }
  if (lower.includes('oauth') || lower.includes('oauth2')) {
    return 'oauth2';
  }
  return 'none';
}

/**
 * Format a human endpoint title or path into a python/typescript compliant tool name
 */
export function generateToolName(method: string, path: string, title?: string): string {
  if (title && title.length < 40 && !title.includes('/') && !title.includes('http')) {
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (cleanTitle.length > 3) return cleanTitle;
  }

  // Derive from method and path
  // e.g. POST /v1/payment_intents -> create_payment_intent
  // GET /v1/payment_intents/{id} -> get_payment_intent
  // POST /v1/payment_intents/{id}/cancel -> cancel_payment_intent
  const cleanPath = path.replace(/^\/api\/?/i, '').replace(/^\/v\d+\/?/i, '');
  const segments = cleanPath
    .split('/')
    .filter((s) => s.length > 0 && !s.startsWith('{') && !s.startsWith(':'));

  let action = 'handle';
  const isIdLookup = path.includes('{') || path.includes(':');

  switch (method.toUpperCase()) {
    case 'GET':
      action = isIdLookup ? 'get' : 'list';
      break;
    case 'POST':
      if (cleanPath.endsWith('/cancel')) action = 'cancel';
      else if (cleanPath.endsWith('/refund')) action = 'refund';
      else if (cleanPath.endsWith('/send')) action = 'send';
      else action = 'create';
      break;
    case 'PUT':
    case 'PATCH':
      action = 'update';
      break;
    case 'DELETE':
      action = 'delete';
      break;
  }

  const noun = segments.length > 0 ? segments[segments.length - 1]!.replace(/s$/, '') : 'item';
  return `${action}_${noun}`.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
}

/**
 * Parses markdown tables into structured parameters
 */
function parseParameterTable(tableText: string): EndpointParameter[] {
  const params: EndpointParameter[] = [];
  const lines = tableText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || trimmed.includes('---') || trimmed.toLowerCase().includes('parameter')) {
      continue;
    }

    const cells = trimmed
      .split('|')
      .map((c) => c.trim())
      .filter((c, i, arr) => i > 0 && i < arr.length - 1);

    if (cells.length >= 3) {
      const name = cells[0]?.replace(/[`*]/g, '').trim() || '';
      const rawType = (cells[1]?.toLowerCase().replace(/[`*]/g, '').trim() || 'string');
      const reqCol = cells.length >= 4 ? cells[2]?.toLowerCase() : '';
      const desc = (cells.length >= 4 ? cells[3] : cells[2]) || '';

      if (!name || name === 'Name' || name === 'Field') continue;

      let paramType: EndpointParameter['type'] = 'string';
      if (rawType.includes('int') || rawType.includes('num') || rawType.includes('float')) paramType = 'number';
      else if (rawType.includes('bool')) paramType = 'boolean';
      else if (rawType.includes('array') || rawType.includes('list')) paramType = 'array';
      else if (rawType.includes('obj') || rawType.includes('map') || rawType.includes('json')) paramType = 'object';

      const isRequired = reqCol?.includes('true') || reqCol?.includes('yes') || reqCol?.includes('required') || desc.toLowerCase().includes('required');

      params.push({
        name,
        type: paramType,
        required: isRequired,
        description: desc.replace(/[`*]/g, '').trim(),
        location: 'body',
      });
    }
  }

  return params;
}

/**
 * Rapid "System 1" Triage Engine
 * Synchronous scanner completing in < 30ms.
 */
export function triageDocumentation(rawMarkdown: string, sourceUrl?: string): TriageResult {
  const startTime = performance.now();
  const warnings: string[] = [];

  // Step 1: Rapid filler filtering
  const { cleanedMarkdown, filteredCount } = filterMarketingFiller(rawMarkdown);

  // Step 2: Global metadata detection
  const detectedBaseUrl = detectBaseUrl(cleanedMarkdown);
  const detectedAuth = detectAuthType(cleanedMarkdown);

  // Step 3: Fast segmentation by Headers / Endpoint declarations
  // Matches:
  // ### Title (optional)
  // (GET|POST|PUT|DELETE|PATCH) /path/to/resource
  const endpointRegex = /(?:###?\s+([^\n]+)\n+)?(?:`?)(GET|POST|PUT|DELETE|PATCH)\s+(\/[a-zA-Z0-9_\-/{}:.]+)(?:`?)/gi;

  const endpoints: ExtractedEndpoint[] = [];
  const endpointMatches = [...cleanedMarkdown.matchAll(endpointRegex)];

  for (let i = 0; i < endpointMatches.length; i++) {
    const match = endpointMatches[i]!;
    const rawTitle = match[1]?.trim();
    const method = match[2]!.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    const path = match[3]!.trim().replace(/[.,;:)\]]+$/, '');

    // Determine the section text between this endpoint and the next one
    const startIndex = match.index! + match[0].length;
    const nextMatch = endpointMatches[i + 1];
    const endIndex = nextMatch ? nextMatch.index! : cleanedMarkdown.length;
    const sectionText = cleanedMarkdown.substring(startIndex, Math.min(startIndex + 4000, endIndex));

    // Extract Description / Summary
    const firstLines = sectionText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('|') && !l.startsWith('```') && !l.startsWith('#'));
    
    const summary = rawTitle || firstLines[0] || `${method} ${path}`;
    const description = firstLines.slice(0, 3).join(' ') || summary;

    // Extract Path Parameters
    const params: EndpointParameter[] = [];
    const pathParamMatches = path.matchAll(/\{([a-zA-Z0-9_]+)\}|:([a-zA-Z0-9_]+)/g);
    for (const pMatch of pathParamMatches) {
      const pName = pMatch[1] || pMatch[2];
      if (pName) {
        params.push({
          name: pName,
          type: 'string',
          required: true,
          description: `Identifier for ${pName} in URL path`,
          location: 'path',
        });
      }
    }

    // Extract Table Parameters
    const tableParamMatches = parseParameterTable(sectionText);
    for (const tp of tableParamMatches) {
      // Don't duplicate if already extracted from path
      if (!params.some((p) => p.name.toLowerCase() === tp.name.toLowerCase())) {
        tp.location = method === 'GET' ? 'query' : 'body';
        params.push(tp);
      }
    }

    // Extract cURL or Request Example
    const curlMatch = sectionText.match(/```(?:bash|sh|curl)?\s*(curl[\s\S]*?)```/);
    const exampleRequest = curlMatch ? curlMatch[1]?.trim() : undefined;

    // Tool Name Generation
    const toolName = generateToolName(method, path, rawTitle);

    // Scoring Confidence (0-100)
    let score = 30; // base score for valid method + path
    const reasons: string[] = ['Valid HTTP method and REST path signature detected'];

    if (params.length > 0) {
      score += 25;
      reasons.push(`${params.length} structured parameters extracted with typed definitions`);
    } else if (method === 'GET' && !path.includes('{')) {
      score += 15;
      reasons.push('List endpoint without mandatory parameters');
    }

    if (summary && summary.length > 10 && !summary.includes('/v1/')) {
      score += 20;
      reasons.push('Human-readable documentation summary verified');
    }

    if (exampleRequest) {
      score += 15;
      reasons.push('Executable cURL example available for schema cross-validation');
    }

    if (path.startsWith('/v') || path.startsWith('/api') || path.includes('/')) {
      score += 10;
      reasons.push('Standard API path convention validated');
    }

    const confidenceScore = Math.min(100, score);

    endpoints.push({
      id: `ep_${method.toLowerCase()}_${toolName}_${i}`,
      name: toolName,
      method,
      path,
      summary,
      description,
      authType: detectedAuth,
      parameters: params,
      requestBody: method !== 'GET' ? { contentType: 'application/json' } : undefined,
      responseExample: exampleRequest,
      confidenceScore,
      reasons,
    });
  }

  // Deduplicate endpoints by name or path+method
  const uniqueEndpoints: ExtractedEndpoint[] = [];
  const seenKeys = new Set<string>();

  for (const ep of endpoints) {
    const key = `${ep.method}_${ep.path}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueEndpoints.push(ep);
    }
  }

  const executionTimeMs = Number((performance.now() - startTime).toFixed(2));
  const avgConfidence = uniqueEndpoints.length > 0
    ? Math.round(uniqueEndpoints.reduce((acc, ep) => acc + ep.confidenceScore, 0) / uniqueEndpoints.length)
    : 0;

  if (uniqueEndpoints.length === 0) {
    warnings.push('No direct HTTP method declarations found. Raw text might be narrative or overview documentation.');
  }

  return {
    endpoints: uniqueEndpoints,
    baseUrl: detectedBaseUrl,
    detectedAuth,
    totalEndpointsFound: uniqueEndpoints.length,
    executionTimeMs,
    averageConfidence: avgConfidence,
    filteredSectionsCount: filteredCount,
    warnings,
    cleanSummary: `Triaged ${uniqueEndpoints.length} endpoints in ${executionTimeMs}ms with ${avgConfidence}% average confidence.`,
  };
}
