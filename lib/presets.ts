import { PresetDemo } from '@/types';

export const PRESET_DEMOS: PresetDemo[] = [
  {
    id: 'resend',
    title: 'Resend Email API',
    icon: '⚡',
    url: 'https://resend.com/docs/api-reference/emails/send-email',
    serviceName: 'Resend Email Service',
    provider: 'resend',
    description: 'High-deliverability transactional email API with batch support and analytics.',
    endpoints: [
      {
        id: 'send_email',
        name: 'send_email',
        method: 'POST',
        path: '/emails',
        description: 'Send a transactional email with HTML, plaintext, attachments, or tags.',
        category: 'Emails',
        parameters: [
          {
            name: 'from',
            type: 'string',
            required: true,
            description: 'Sender email address with optional name (e.g. "Acme <onboarding@resend.dev>")',
            example: 'onboarding@resend.dev',
          },
          {
            name: 'to',
            type: 'string',
            required: true,
            description: 'Recipient email address (comma-separated or single address)',
            example: 'delivered@resend.dev',
          },
          {
            name: 'subject',
            type: 'string',
            required: true,
            description: 'The subject line of the email',
            example: 'Welcome to OmniForge!',
          },
          {
            name: 'html',
            type: 'string',
            required: false,
            description: 'The HTML version of the message body',
            example: '<h1>Welcome!</h1><p>Your FastMCP server is live.</p>',
          },
          {
            name: 'text',
            type: 'string',
            required: false,
            description: 'The plain text version of the message body',
            example: 'Welcome to OmniForge. Your FastMCP server is live.',
          },
        ],
        responseExample: {
          id: '49a3999c-0ce1-4ea6-ab68-af626e79d927',
          from: 'onboarding@resend.dev',
          to: 'delivered@resend.dev',
          created_at: '2026-10-05T15:10:00.000Z',
        },
      },
      {
        id: 'get_email',
        name: 'get_email',
        method: 'GET',
        path: '/emails/{email_id}',
        description: 'Retrieve the delivery status, recipient details, and headers of a sent email.',
        category: 'Emails',
        parameters: [
          {
            name: 'email_id',
            type: 'string',
            required: true,
            description: 'The unique identifier of the sent email',
            example: '49a3999c-0ce1-4ea6-ab68-af626e79d927',
          },
        ],
        responseExample: {
          id: '49a3999c-0ce1-4ea6-ab68-af626e79d927',
          object: 'email',
          to: ['delivered@resend.dev'],
          from: 'onboarding@resend.dev',
          created_at: '2026-10-05T15:10:00.000Z',
          subject: 'Welcome to OmniForge!',
          html: '<h1>Welcome!</h1>',
          text: 'Welcome!',
          last_event: 'delivered',
        },
      },
      {
        id: 'list_api_keys',
        name: 'list_api_keys',
        method: 'GET',
        path: '/api-keys',
        description: 'List all API keys created under this team account.',
        category: 'API Keys',
        parameters: [],
        responseExample: {
          data: [
            {
              id: '91f6305a-59a8-4c12-9c4c-35d0e2e9c135',
              name: 'Production Key',
              created_at: '2026-09-01T12:00:00.000Z',
            },
          ],
        },
      },
    ],
    generatedFiles: {
      fastmcp_py: `"""
OmniForge FastMCP Server: Resend Email Service
Auto-generated from documentation via Firecrawl + LAYA Reflex + Groq LPU.
"""

import os
from typing import Optional, List, Dict, Any
import httpx
from mcp.server.fastmcp import FastMCP

# Initialize FastMCP Server
mcp = FastMCP(
    "Resend Email Service",
    dependencies=["httpx"]
)

RESEND_API_BASE = "https://api.resend.com"
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")


def _get_headers() -> Dict[str, str]:
    token = os.environ.get("RESEND_API_KEY", RESEND_API_KEY)
    if not token:
        raise ValueError("RESEND_API_KEY environment variable is required")
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "OmniForge-FastMCP/1.0"
    }


@mcp.tool()
async def send_email(
    to: str,
    subject: str,
    from_email: str = "onboarding@resend.dev",
    html: Optional[str] = None,
    text: Optional[str] = None
) -> Dict[str, Any]:
    """
    Send a transactional email using the Resend API.
    
    Args:
        to: Recipient email address
        subject: The subject line of the email
        from_email: Sender address (defaults to onboarding@resend.dev)
        html: Optional HTML formatted content
        text: Optional plain text fallback content
    """
    payload: Dict[str, Any] = {
        "from": from_email,
        "to": [t.strip() for t in to.split(",")],
        "subject": subject,
    }
    if html:
        payload["html"] = html
    if text:
        payload["text"] = text

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{RESEND_API_BASE}/emails",
            headers=_get_headers(),
            json=payload,
            timeout=15.0
        )
        response.raise_for_status()
        return response.json()


@mcp.tool()
async def get_email(email_id: str) -> Dict[str, Any]:
    """
    Retrieve the delivery status and metadata for a sent email.
    
    Args:
        email_id: Unique UUID string identifier of the email
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{RESEND_API_BASE}/emails/{email_id}",
            headers=_get_headers(),
            timeout=10.0
        )
        response.raise_for_status()
        return response.json()


if __name__ == "__main__":
    mcp.run()
`,
      mcp_ts: `/**
 * OmniForge TypeScript MCP Server: Resend Email Service
 * Generated via Firecrawl + LAYA Reflex + Groq LPU
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "Resend Email Service",
  version: "1.0.0",
});

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

server.tool(
  "send_email",
  "Send a transactional email with HTML or text content",
  {
    to: z.string().describe("Recipient email address"),
    subject: z.string().describe("Subject of the email"),
    from: z.string().default("onboarding@resend.dev"),
    html: z.string().optional(),
    text: z.string().optional(),
  },
  async ({ to, subject, from, html, text }) => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${RESEND_API_KEY}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
      }),
    });
    const data = await res.json();
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
`,
      docker_compose: `version: "3.8"

services:
  omniforge-fastmcp-resend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - RESEND_API_KEY=\${RESEND_API_KEY}
    restart: unless-stopped
    command: ["python", "server.py"]
`,
      readme: `# Resend Email Service - FastMCP Server

Synthesized autonomously by **OmniForge** from live documentation.

## Discovered Tools
- \`send_email\`: Sends transactional emails via Resend.
- \`get_email\`: Retrieves message status and timestamps.
- \`list_api_keys\`: Inspects team API keys.

## Quickstart (FastMCP)
\`\`\`bash
# Install dependencies
pip install "mcp[cli]" httpx

# Set your API key
export RESEND_API_KEY="re_123456789"

# Run locally
python server.py
\`\`\`

## Claude Desktop Configuration
Add to \`claude_desktop_config.json\`:
\`\`\`json
{
  "mcpServers": {
    "resend": {
      "command": "python",
      "args": ["/path/to/server.py"],
      "env": {
        "RESEND_API_KEY": "re_your_api_key_here"
      }
    }
  }
}
\`\`\`
`,
      schema_json: JSON.stringify(
        {
          name: 'Resend Email Service',
          version: '1.0.0',
          tools: [
            {
              name: 'send_email',
              description: 'Send a transactional email using the Resend API.',
              inputSchema: {
                type: 'object',
                properties: {
                  to: { type: 'string', description: 'Recipient email address' },
                  subject: { type: 'string', description: 'The subject line of the email' },
                  from_email: { type: 'string', default: 'onboarding@resend.dev' },
                  html: { type: 'string' },
                  text: { type: 'string' },
                },
                required: ['to', 'subject'],
              },
            },
            {
              name: 'get_email',
              description: 'Retrieve the delivery status and metadata for a sent email.',
              inputSchema: {
                type: 'object',
                properties: {
                  email_id: { type: 'string', description: 'Unique identifier' },
                },
                required: ['email_id'],
              },
            },
          ],
        },
        null,
        2
      ),
    },
  },
  {
    id: 'stripe',
    title: 'Stripe Payments',
    icon: '💳',
    url: 'https://docs.stripe.com/api/charges/create',
    serviceName: 'Stripe Billing & Charges API',
    provider: 'stripe',
    description: 'Create charges, payment intents, and inspect payment transactions.',
    endpoints: [
      {
        id: 'create_charge',
        name: 'create_charge',
        method: 'POST',
        path: '/v1/charges',
        description: 'To charge a credit or debit card, create a Charge object.',
        category: 'Charges',
        parameters: [
          {
            name: 'amount',
            type: 'number',
            required: true,
            description: 'Amount intended to be collected in the smallest currency unit (e.g. 2000 for $20.00)',
            example: 2000,
          },
          {
            name: 'currency',
            type: 'string',
            required: true,
            description: 'Three-letter ISO currency code, in lowercase (e.g. usd, eur)',
            example: 'usd',
          },
          {
            name: 'source',
            type: 'string',
            required: false,
            description: 'A payment source token, like tok_visa or card token',
            example: 'tok_visa',
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Arbitrary string displayed on statement',
            example: 'OmniForge MCP Pro Subscription',
          },
        ],
        responseExample: {
          id: 'ch_3MtwBwLkdIwHu7ix0snN0B15',
          object: 'charge',
          amount: 2000,
          currency: 'usd',
          paid: true,
          status: 'succeeded',
        },
      },
      {
        id: 'retrieve_charge',
        name: 'retrieve_charge',
        method: 'GET',
        path: '/v1/charges/{charge_id}',
        description: 'Retrieves the details of an existing charge.',
        category: 'Charges',
        parameters: [
          {
            name: 'charge_id',
            type: 'string',
            required: true,
            description: 'The identifier of the charge to be retrieved.',
            example: 'ch_3MtwBwLkdIwHu7ix0snN0B15',
          },
        ],
        responseExample: {
          id: 'ch_3MtwBwLkdIwHu7ix0snN0B15',
          object: 'charge',
          amount: 2000,
          currency: 'usd',
          captured: true,
          status: 'succeeded',
        },
      },
    ],
    generatedFiles: {
      fastmcp_py: `"""
OmniForge FastMCP Server: Stripe Billing & Charges API
"""

import os
from typing import Optional, Dict, Any
import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Stripe Charges API", dependencies=["httpx"])
STRIPE_API_BASE = "https://api.stripe.com/v1"


def _headers() -> Dict[str, str]:
    key = os.environ.get("STRIPE_SECRET_KEY", "")
    return {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/x-www-form-urlencoded"
    }


@mcp.tool()
async def create_charge(
    amount: int,
    currency: str = "usd",
    source: str = "tok_visa",
    description: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a charge object in Stripe.
    
    Args:
        amount: Integer amount in cents (e.g. 2000 for $20.00)
        currency: Three-letter ISO currency code
        source: Token representing card source (e.g. tok_visa)
        description: Optional order description
    """
    data = {
        "amount": str(amount),
        "currency": currency,
        "source": source
    }
    if description:
        data["description"] = description

    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{STRIPE_API_BASE}/charges", headers=_headers(), data=data)
        resp.raise_for_status()
        return resp.json()


@mcp.tool()
async def retrieve_charge(charge_id: str) -> Dict[str, Any]:
    """
    Retrieve an existing charge by ID.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{STRIPE_API_BASE}/charges/{charge_id}", headers=_headers())
        resp.raise_for_status()
        return resp.json()

if __name__ == "__main__":
    mcp.run()
`,
      mcp_ts: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "Stripe Charges API", version: "1.0.0" });

server.tool(
  "create_charge",
  "Create a charge in Stripe",
  {
    amount: z.number().describe("Amount in cents"),
    currency: z.string().default("usd"),
    source: z.string().default("tok_visa"),
    description: z.string().optional(),
  },
  async ({ amount, currency, source, description }) => {
    return {
      content: [{ type: "text", text: JSON.stringify({ id: "ch_mock_success", amount, currency, status: "succeeded" }, null, 2) }]
    };
  }
);

const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
`,
      docker_compose: `version: "3.8"\nservices:\n  stripe-mcp:\n    build: .\n    environment:\n      - STRIPE_SECRET_KEY=\${STRIPE_SECRET_KEY}\n`,
      readme: `# Stripe Charges FastMCP Server\nCreated via OmniForge.`,
      schema_json: `{"name":"Stripe Charges API","version":"1.0.0"}`,
    },
  },
  {
    id: 'firecrawl',
    title: 'Firecrawl Web Scraper',
    icon: '🕷️',
    url: 'https://docs.firecrawl.dev/api-reference/endpoint/scrape',
    serviceName: 'Firecrawl LLM Scraper Engine',
    provider: 'firecrawl',
    description: 'Turn entire websites or single pages into clean LLM-ready markdown.',
    endpoints: [
      {
        id: 'scrape_url',
        name: 'scrape_url',
        method: 'POST',
        path: '/v1/scrape',
        description: 'Scrape a single URL and return markdown, HTML, metadata, and extracted links.',
        category: 'Scrape',
        parameters: [
          {
            name: 'url',
            type: 'string',
            required: true,
            description: 'The target URL to scrape and convert',
            example: 'https://news.ycombinator.com',
          },
          {
            name: 'formats',
            type: 'array',
            required: false,
            description: 'List of formats to return (e.g. ["markdown", "html"])',
            example: ['markdown'],
          },
          {
            name: 'onlyMainContent',
            type: 'boolean',
            required: false,
            description: 'Exclude headers, navbars, and footers for clean text extraction',
            example: true,
          },
        ],
        responseExample: {
          success: true,
          data: {
            markdown: '# Hacker News\n1. Show HN: OmniForge FastMCP Synthesizer...',
            metadata: {
              title: 'Hacker News',
              statusCode: 200,
            },
          },
        },
      },
      {
        id: 'crawl_site',
        name: 'crawl_site',
        method: 'POST',
        path: '/v1/crawl',
        description: 'Crawl an entire domain asynchronously and index subpages.',
        category: 'Crawl',
        parameters: [
          {
            name: 'url',
            type: 'string',
            required: true,
            description: 'The starting URL for deep crawling',
            example: 'https://fastmcp.org',
          },
          {
            name: 'limit',
            type: 'number',
            required: false,
            description: 'Maximum number of pages to crawl',
            example: 10,
          },
        ],
        responseExample: {
          id: 'crawl_job_998124',
          status: 'scraping',
        },
      },
    ],
    generatedFiles: {
      fastmcp_py: `"""
OmniForge FastMCP Server: Firecrawl Scraper
"""

import os
from typing import Optional, List, Dict, Any
import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Firecrawl Scraper", dependencies=["httpx"])
FIRECRAWL_URL = os.environ.get("FIRECRAWL_API_URL", "http://localhost:3002")


@mcp.tool()
async def scrape_url(
    url: str,
    only_main_content: bool = True
) -> Dict[str, Any]:
    """
    Scrape any public URL and convert its content into clean markdown.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{FIRECRAWL_URL}/v1/scrape",
            json={"url": url, "formats": ["markdown"], "onlyMainContent": only_main_content},
            timeout=30.0
        )
        resp.raise_for_status()
        return resp.json()

if __name__ == "__main__":
    mcp.run()
`,
      mcp_ts: `import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "Firecrawl Scraper", version: "1.0.0" });
server.tool("scrape_url", "Scrape URL to markdown", { url: z.string().url() }, async ({ url }) => {
  return { content: [{ type: "text", text: \`# Scraped: \${url}\` }] };
});
const transport = new StdioServerTransport();
server.connect(transport).catch(console.error);
`,
      docker_compose: `version: "3.8"\nservices:\n  firecrawl-mcp:\n    build: .\n    environment:\n      - FIRECRAWL_API_URL=http://localhost:3002\n`,
      readme: `# Firecrawl FastMCP Server\nCreated via OmniForge.`,
      schema_json: `{"name":"Firecrawl Scraper","version":"1.0.0"}`,
    },
  },
  {
    id: 'supabase',
    title: 'Supabase Auth',
    icon: '🔐',
    url: 'https://supabase.com/docs/reference/javascript/auth-signup',
    serviceName: 'Supabase Auth & Session Gateway',
    provider: 'supabase',
    description: 'User registration, OTP authentication, and JWT session handling.',
    endpoints: [
      {
        id: 'sign_up_user',
        name: 'sign_up_user',
        method: 'POST',
        path: '/auth/v1/signup',
        description: 'Creates a new user account with email and password or metadata.',
        category: 'Auth',
        parameters: [
          {
            name: 'email',
            type: 'string',
            required: true,
            description: 'Email address of the user',
            example: 'user@example.com',
          },
          {
            name: 'password',
            type: 'string',
            required: true,
            description: 'Secure account password',
            example: 'SecretP@ssw0rd!123',
          },
        ],
        responseExample: {
          id: 'usr_87fa44b3',
          email: 'user@example.com',
          role: 'authenticated',
          created_at: '2026-10-05T15:10:00.000Z',
        },
      },
    ],
    generatedFiles: {
      fastmcp_py: `"""OmniForge FastMCP Server: Supabase Auth"""\nfrom mcp.server.fastmcp import FastMCP\nmcp = FastMCP("Supabase Auth Gateway")\n\nif __name__ == "__main__":\n    mcp.run()\n`,
      mcp_ts: `// Supabase Auth MCP Server`,
      docker_compose: `version: "3.8"`,
      readme: `# Supabase Auth MCP`,
      schema_json: `{"name":"Supabase Auth"}`,
    },
  },
  {
    id: 'github',
    title: 'GitHub Issues',
    icon: '🐙',
    url: 'https://docs.github.com/en/rest/issues/issues#create-an-issue',
    serviceName: 'GitHub Repository Issues API',
    provider: 'github',
    description: 'Autonomous repository issue tracking, creation, labeling, and milestones.',
    endpoints: [
      {
        id: 'create_issue',
        name: 'create_issue',
        method: 'POST',
        path: '/repos/{owner}/{repo}/issues',
        description: 'Create an issue in a GitHub repository.',
        category: 'Issues',
        parameters: [
          {
            name: 'owner',
            type: 'string',
            required: true,
            description: 'Repository owner (user or organization)',
            example: 'octocat',
          },
          {
            name: 'repo',
            type: 'string',
            required: true,
            description: 'The name of the repository',
            example: 'Hello-World',
          },
          {
            name: 'title',
            type: 'string',
            required: true,
            description: 'The title of the issue',
            example: 'Found a bug in FastMCP generator',
          },
          {
            name: 'body',
            type: 'string',
            required: false,
            description: 'The markdown contents of the issue',
            example: 'Issue reproduction steps...',
          },
        ],
        responseExample: {
          id: 1347,
          number: 42,
          title: 'Found a bug in FastMCP generator',
          state: 'open',
          html_url: 'https://github.com/octocat/Hello-World/issues/42',
        },
      },
    ],
    generatedFiles: {
      fastmcp_py: `"""OmniForge FastMCP Server: GitHub Issues API"""\nfrom mcp.server.fastmcp import FastMCP\nmcp = FastMCP("GitHub Issues API")\n\nif __name__ == "__main__":\n    mcp.run()\n`,
      mcp_ts: `// GitHub Issues MCP Server`,
      docker_compose: `version: "3.8"`,
      readme: `# GitHub Issues FastMCP Server`,
      schema_json: `{"name":"GitHub Issues"}`,
    },
  },
];
