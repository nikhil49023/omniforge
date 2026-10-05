export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface EndpointParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  default?: string | number | boolean | null;
  example?: string | number | boolean | object;
}

export interface ApiEndpoint {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  description: string;
  category?: string;
  parameters: EndpointParameter[];
  responseExample?: Record<string, unknown> | unknown[];
}

export interface PipelineStageInfo {
  id: number;
  key: 'crawl' | 'triage' | 'synthesis' | 'ready';
  name: string;
  subtext: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  latencyMs?: number;
  tokensPerSec?: number;
  metricLabel?: string;
  metricValue?: string;
}

export interface GeneratedCodeFiles {
  fastmcp_py: string;
  mcp_ts: string;
  docker_compose: string;
  readme: string;
  schema_json: string;
}

export interface ToolTestResult {
  success: boolean;
  toolName: string;
  latencyMs: number;
  timestamp: string;
  statusCode?: number;
  result: Record<string, unknown> | unknown[] | string;
  error?: string;
}

export interface PresetDemo {
  id: string;
  title: string;
  icon: string;
  url: string;
  serviceName: string;
  provider: string;
  description: string;
  endpoints: ApiEndpoint[];
  generatedFiles: GeneratedCodeFiles;
}
