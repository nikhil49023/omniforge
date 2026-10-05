/**
 * lib/groq.ts
 * MCP Server Code Generation Engine using Groq (llama-3.3-70b-versatile).
 * Generates production-ready FastMCP Python and TypeScript MCP servers.
 */

import Groq from 'groq-sdk';
import { ExtractedEndpoint, EndpointParameter } from './triage';

export interface GenerationRequest {
  endpoints: ExtractedEndpoint[];
  serverName: string;
  baseUrl?: string;
  authType?: 'bearer' | 'apiKey' | 'basic' | 'oauth2' | 'none';
  envVarName?: string;
  language?: 'python' | 'typescript' | 'both';
  userApiKey?: string;
}

export interface GeneratedMcpResult {
  serverName: string;
  pythonCode: string;
  typescriptCode: string;
  claudeDesktopConfig: string;
  readme: string;
  toolsCount: number;
  modelUsed: string;
  generationTimeMs: number;
}

/**
 * Maps schema parameter types to Python and TypeScript / Zod types
 */
function mapParamType(type: EndpointParameter['type']) {
  switch (type) {
    case 'number':
      return { py: 'float', ts: 'number', zod: 'z.number()' };
    case 'boolean':
      return { py: 'bool', ts: 'boolean', zod: 'z.boolean()' };
    case 'array':
      return { py: 'List[Any]', ts: 'any[]', zod: 'z.array(z.any())' };
    case 'object':
      return { py: 'Dict[str, Any]', ts: 'Record<string, any>', zod: 'z.record(z.any())' };
    case 'string':
    default:
      return { py: 'str', ts: 'string', zod: 'z.string()' };
  }
}

/**
 * Deterministic FastMCP Python Code Generator
 * Conforms to verified FastMCP protocol standards:
 * from mcp.server.fastmcp import FastMCP, Context
 */
export function generateDeterministicPython(req: GenerationRequest): string {
  const cleanServerName = req.serverName.replace(/[^a-zA-Z0-9_]/g, '_');
  const envVar = req.envVarName || `${cleanServerName.toUpperCase()}_API_KEY`;
  const baseUrl = req.baseUrl || 'https://api.example.com';

  const toolSnippets = req.endpoints.map((ep) => {
    const fnName = ep.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    // Build parameter signatures
    const paramSignatures = ep.parameters.map((p) => {
      const typeInfo = mapParamType(p.type);
      const cleanName = p.name.replace(/[^a-zA-Z0-9_]/g, '_');
      const desc = p.description.replace(/"/g, '\\"');
      if (p.required) {
        return `${cleanName}: ${typeInfo.py} = Field(description="${desc}")`;
      }
      return `${cleanName}: Optional[${typeInfo.py}] = Field(default=None, description="${desc}")`;
    });

    paramSignatures.push('ctx: Optional[Context] = None');
    const paramStr = paramSignatures.join(',\n    ');

    // Build URL formatting for path parameters
    let pathExpr = `f"${ep.path}"`;
    for (const p of ep.parameters.filter((p) => p.location === 'path')) {
      const cleanName = p.name.replace(/[^a-zA-Z0-9_]/g, '_');
      pathExpr = pathExpr.replace(`{${p.name}}`, `{${cleanName}}`).replace(`:${p.name}`, `{${cleanName}}`);
    }

    const queryParams = ep.parameters
      .filter((p) => p.location === 'query')
      .map((p) => `"${p.name}": ${p.name.replace(/[^a-zA-Z0-9_]/g, '_')}`)
      .join(', ');

    const bodyParams = ep.parameters
      .filter((p) => p.location === 'body')
      .map((p) => `"${p.name}": ${p.name.replace(/[^a-zA-Z0-9_]/g, '_')}`)
      .join(', ');

    return `
@mcp.tool()
async def ${fnName}(
    ${paramStr}
) -> dict:
    """
    ${ep.summary.replace(/"/g, '\\"')}
    Endpoint: ${ep.method} ${ep.path}
    """
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {API_KEY}" if API_KEY else "",
    }
    params = {k: v for k, v in {${queryParams}}.items() if v is not None}
    json_data = {k: v for k, v in {${bodyParams}}.items() if v is not None}

    async with httpx.AsyncClient(base_url=BASE_URL, headers=headers, timeout=30.0) as client:
        try:
            response = await client.request(
                method="${ep.method}",
                url=${pathExpr},
                params=params or None,
                json=json_data if "${ep.method}" in ["POST", "PUT", "PATCH"] and json_data else None,
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            return {
                "error": True,
                "status_code": e.response.status_code,
                "detail": e.response.text,
            }
        except Exception as e:
            return {"error": True, "detail": str(e)}
`.trim();
  });

  return `"""
FastMCP Server for ${req.serverName}
Generated autonomously by OmniForge.
Specification: FastMCP (Python)
"""

import os
from typing import Optional, Any, Dict, List
import httpx
from pydantic import Field
from mcp.server.fastmcp import FastMCP, Context

# Initialize FastMCP Server
mcp = FastMCP("${req.serverName}")

BASE_URL = os.getenv("${cleanServerName.toUpperCase()}_BASE_URL", "${baseUrl}")
API_KEY = os.getenv("${envVar}", "")

${toolSnippets.join('\n\n')}

if __name__ == "__main__":
    mcp.run(transport="stdio")
`;
}

/**
 * Deterministic TypeScript McpServer Code Generator
 * Conforms to verified MCP SDK standards:
 * import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
 */
export function generateDeterministicTypeScript(req: GenerationRequest): string {
  const cleanServerName = req.serverName.replace(/[^a-zA-Z0-9_]/g, '_');
  const envVar = req.envVarName || `${cleanServerName.toUpperCase()}_API_KEY`;
  const baseUrl = req.baseUrl || 'https://api.example.com';

  const toolSnippets = req.endpoints.map((ep) => {
    const fnName = ep.name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    
    // Zod schema parameters
    const zodFields = ep.parameters.map((p) => {
      const typeInfo = mapParamType(p.type);
      const cleanName = p.name.replace(/[^a-zA-Z0-9_]/g, '_');
      const desc = p.description.replace(/"/g, '\\"');
      const zodBase = `${typeInfo.zod}.describe("${desc}")`;
      return `    ${cleanName}: ${p.required ? zodBase : `${zodBase}.optional()`},`;
    });

    const zodSchemaStr = zodFields.length > 0 ? `{\n${zodFields.join('\n')}\n  }` : '{}';
    const paramNames = ep.parameters.map((p) => p.name.replace(/[^a-zA-Z0-9_]/g, '_')).join(', ');
    const paramDestructure = paramNames.length > 0 ? `{ ${paramNames} }` : '_args';

    return `
server.tool(
  "${fnName}",
  "${ep.summary.replace(/"/g, '\\"')}",
  ${zodSchemaStr},
  async (${paramDestructure}) => {
    try {
      let url = \`\${BASE_URL}${ep.path}\`;
      const headers: Record<string, string> = {
        "Accept": "application/json",
        "Content-Type": "application/json",
      };
      if (API_KEY) {
        headers["Authorization"] = \`Bearer \${API_KEY}\`;
      }

      const response = await fetch(url, {
        method: "${ep.method}",
        headers,
        ${ep.method !== 'GET' && paramNames.length > 0 ? `body: JSON.stringify(${paramDestructure}),` : ''}
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          content: [
            {
              type: "text",
              text: \`HTTP \${response.status}: \${errorText}\`,
            },
          ],
          isError: true,
        };
      }

      const data = await response.json();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: \`Execution failed: \${error.message}\`,
          },
        ],
        isError: true,
      };
    }
  }
);
`.trim();
  });

  return `/**
 * TypeScript McpServer for ${req.serverName}
 * Generated autonomously by OmniForge.
 * Specification: @modelcontextprotocol/sdk McpServer
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = process.env.${cleanServerName.toUpperCase()}_BASE_URL || "${baseUrl}";
const API_KEY = process.env.${envVar} || "";

const server = new McpServer({
  name: "${req.serverName}",
  version: "1.0.0",
});

${toolSnippets.join('\n\n')}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("${req.serverName} MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
`;
}

/**
 * Generate Claude Desktop Configuration JSON
 */
export function generateClaudeDesktopConfig(serverName: string, envVar: string): string {
  const config = {
    mcpServers: {
      [serverName.toLowerCase().replace(/[^a-z0-9_-]/g, '-')]: {
        command: 'python3',
        args: [`/absolute/path/to/${serverName.toLowerCase()}_server.py`],
        env: {
          [envVar]: 'YOUR_API_KEY_HERE',
        },
      },
    },
  };
  return JSON.stringify(config, null, 2);
}

/**
 * Generate README.md with run instructions
 */
export function generateReadme(serverName: string, envVar: string, toolsCount: number): string {
  return `# ${serverName} MCP Server

Generated with **OmniForge** from live documentation.

## Features
- **Tools Generated**: ${toolsCount} tools
- **Transports**: STDIO (compatible with Claude Desktop, Cursor, and Zed)
- **Implementations**:
  - Python FastMCP (\`server.py\`)
  - TypeScript MCP (\`server.ts\`)

## Python Setup
\`\`\`bash
pip install "mcp[cli]" httpx pydantic
export ${envVar}="your_secret_key"
python3 server.py
\`\`\`

## TypeScript Setup
\`\`\`bash
npm install @modelcontextprotocol/sdk zod
export ${envVar}="your_secret_key"
npx tsx server.ts
\`\`\`

## Claude Desktop Configuration
Add the configuration snippet to \`~/Library/Application Support/Claude/claude_desktop_config.json\` (macOS) or \`%APPDATA%\\Claude\\claude_desktop_config.json\` (Windows).
`;
}

/**
 * Call Groq API with llama-3.3-70b-versatile (with fallback to openai/gpt-oss-120b and deterministic engine)
 */
export async function generateMcpServers(req: GenerationRequest): Promise<GeneratedMcpResult> {
  const startTime = performance.now();
  const apiKey = req.userApiKey || process.env.GROQ_API_KEY;
  const envVar = req.envVarName || `${req.serverName.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}_API_KEY`;

  let pythonCode: string | null = null;
  let typescriptCode: string | null = null;
  let modelUsed = 'openai/gpt-oss-120b';

  if (apiKey) {
    const groq = new Groq({ apiKey });

    // Primary model is openai/gpt-oss-120b on this Groq account, fallback to openai/gpt-oss-20b
    const candidateModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];

    for (const model of candidateModels) {
      try {
        const prompt = `You are a Principal Protocol Engineer generating an MCP (Model Context Protocol) Server for "${req.serverName}".
Base URL: ${req.baseUrl || 'https://api.example.com'}
Auth Env Var: ${envVar}

Endpoints to convert into tools:
${JSON.stringify(req.endpoints.map(e => ({
  name: e.name,
  method: e.method,
  path: e.path,
  summary: e.summary,
  params: e.parameters
})), null, 2)}

REQUIREMENTS:
1. FastMCP Python server:
   - Must import: \`from mcp.server.fastmcp import FastMCP, Context\`
   - Must import: \`from pydantic import Field\`
   - Server definition: \`mcp = FastMCP("${req.serverName}")\`
   - Each tool decorated with \`@mcp.tool()\`
   - Async functions with type annotations and Field(description=...)
   - Entry point: \`if __name__ == "__main__": mcp.run(transport="stdio")\`

2. TypeScript MCP server:
   - Must import: \`import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";\`
   - Must import: \`import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";\`
   - Must import: \`import { z } from "zod";\`
   - Server definition: \`const server = new McpServer({ name: "${req.serverName}", version: "1.0.0" });\`
   - Each tool: \`server.tool(name, description, zodSchema, async (args) => { return { content: [{ type: "text", text: ... }] }; });\`
   - Entry point: \`const transport = new StdioServerTransport(); await server.connect(transport);\`

Return a JSON object with this exact shape:
{
  "pythonCode": "string (complete executable Python FastMCP code)",
  "typescriptCode": "string (complete executable TypeScript McpServer code)"
}`;

        const response = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are an elite code generator producing clean, syntactically correct, and production-ready MCP servers in JSON format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_completion_tokens: 4096,
        });

        const rawContent = response.choices[0]?.message?.content;
        if (rawContent) {
          const parsed = JSON.parse(rawContent);
          if (parsed.pythonCode && parsed.typescriptCode) {
            pythonCode = parsed.pythonCode;
            typescriptCode = parsed.typescriptCode;
            modelUsed = model;
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[Groq] Model ${model} unavailable or failed: ${err.message}. Trying next option.`);
      }
    }
  }

  // If LLM returned valid code, use it; otherwise seamlessly fall back to deterministic generator
  if (!pythonCode) {
    pythonCode = generateDeterministicPython(req);
    modelUsed = 'deterministic-ast-engine';
  }
  if (!typescriptCode) {
    typescriptCode = generateDeterministicTypeScript(req);
  }

  const claudeDesktopConfig = generateClaudeDesktopConfig(req.serverName, envVar);
  const readme = generateReadme(req.serverName, envVar, req.endpoints.length);
  const generationTimeMs = Number((performance.now() - startTime).toFixed(2));

  return {
    serverName: req.serverName,
    pythonCode,
    typescriptCode,
    claudeDesktopConfig,
    readme,
    toolsCount: req.endpoints.length,
    modelUsed,
    generationTimeMs,
  };
}
