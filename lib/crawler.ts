/**
 * lib/crawler.ts
 * Scraping engine for OmniForge using Firecrawl-Local with resilient fallback datasets.
 */

export interface ScrapeOptions {
  timeoutMs?: number;
  onlyMainContent?: boolean;
  formats?: ('markdown' | 'html' | 'rawHtml')[];
  forceFallback?: boolean;
}

export interface ScrapeResult {
  url: string;
  title: string;
  markdown: string;
  source: 'firecrawl-local' | 'demo-fallback';
  statusCode: number;
  latencyMs: number;
  metadata?: {
    description?: string;
    language?: string;
    sourceURL?: string;
    [key: string]: any;
  };
}

// Fallback / Demo datasets for popular documentation APIs
export const POPULAR_FALLBACK_DATASETS: Record<string, { title: string; url: string; markdown: string }> = {
  stripe: {
    title: 'Stripe API Reference - Payments & Customers',
    url: 'https://docs.stripe.com/api',
    markdown: `
# Stripe API Reference

The Stripe API is organized around REST. All requests require HTTP Basic Authentication with your secret API key.
Base URL: \`https://api.stripe.com/v1\`

## Authentication
Authentication to the API is performed via HTTP Basic Auth. Provide your API key as the basic auth username value. You do not need to provide a password.
\`\`\`bash
curl https://api.stripe.com/v1/charges \\
  -u YOUR_STRIPE_SECRET_KEY:
\`\`\`

## Payment Intents

### Create a PaymentIntent
POST /v1/payment_intents
Creates a PaymentIntent object to initiate a payment flow.

#### Request Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| amount | integer | true | Amount intended to be collected in smallest currency unit (e.g., 1000 for $10.00). |
| currency | string | true | Three-letter ISO currency code, in lowercase (e.g. "usd", "eur"). |
| customer | string | false | ID of the Customer this PaymentIntent belongs to. |
| description | string | false | An arbitrary string attached to the object for display purposes. |
| payment_method | string | false | ID of the payment method to use for this intent. |

#### Example Request
\`\`\`bash
curl https://api.stripe.com/v1/payment_intents \\
  -u YOUR_STRIPE_SECRET_KEY: \\
  -d amount=2000 \\
  -d currency=usd \\
  -d "payment_method_types[]"=card
\`\`\`

### Retrieve a PaymentIntent
GET /v1/payment_intents/{intent_id}
Retrieves the details of a PaymentIntent that has previously been created.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| intent_id | string | true | The unique identifier of the payment intent (e.g. pi_12345). |

### Cancel a PaymentIntent
POST /v1/payment_intents/{intent_id}/cancel
A PaymentIntent object can be canceled when it is in one of these statuses: requires_payment_method, requires_capture, requires_confirmation, requires_action.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| intent_id | string | true | Unique identifier of the payment intent to cancel. |

| Parameter | Type | Required | Description |
| cancellation_reason | string | false | Reason for canceling this PaymentIntent: duplicate, fraudulent, requested_by_customer, or abandoned. |

## Customers

### Create a Customer
POST /v1/customers
Creates a new customer object.

#### Request Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| email | string | false | The customer's email address. |
| name | string | false | The customer's full name or business name. |
| phone | string | false | The customer's phone number. |
| description | string | false | An arbitrary string that you can attach to a customer object. |

### List all Customers
GET /v1/customers
Returns a list of your customers.

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| limit | integer | false | Number of objects to return (default 10, max 100). |
| starting_after | string | false | Cursor for pagination: an object ID defining your place in the list. |
| email | string | false | Filter customers matching this exact email. |

## Refunds

### Create a Refund
POST /v1/refunds
When you create a new refund, you must specify a charge or payment intent on which to create it.

#### Request Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| payment_intent | string | false | The identifier of the PaymentIntent to refund. |
| amount | integer | false | A positive integer in cents representing how much of this charge to refund. |
| reason | string | false | Reason for the refund: duplicate, fraudulent, or requested_by_customer. |
`,
  },
  resend: {
    title: 'Resend API Reference - Transactional Email',
    url: 'https://resend.com/docs/api-reference',
    markdown: `
# Resend API Reference

The Resend API enables modern transactional email delivery at scale.
Base URL: \`https://api.resend.com\`

## Authentication
Every request requires an Authorization header with Bearer token format:
\`Authorization: Bearer re_123456789\`

## Emails

### Send an Email
POST /emails
Send an email to one or multiple recipients.

#### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| from | string | true | Sender email address including name (e.g. "Acme <onboarding@resend.dev>"). |
| to | array | true | List of recipient email addresses. |
| subject | string | true | Email subject line. |
| html | string | false | The HTML version of the message. |
| text | string | false | The plain text version of the message. |
| reply_to | string | false | Reply-to email address. |
| cc | array | false | Carbon copy recipient email addresses. |
| bcc | array | false | Blind carbon copy recipient email addresses. |

#### Example cURL
\`\`\`bash
curl -X POST 'https://api.resend.com/emails' \\
  -H 'Authorization: Bearer re_123' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "from": "Acme <onboarding@resend.dev>",
    "to": ["delivered@resend.dev"],
    "subject": "hello world",
    "html": "<p>it works!</p>"
  }'
\`\`\`

### Retrieve an Email
GET /emails/{email_id}
Retrieve the status and metadata of a sent email.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| email_id | string | true | The unique identifier of the sent email. |

### Batch Send Emails
POST /emails/batch
Send up to 100 emails in a single API call.

#### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| emails | array | true | Array of email objects to send. |

## Domains

### List Domains
GET /domains
Retrieve a list of verified sending domains.

### Create Domain
POST /domains
Register a new domain for sending.

#### Request Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| name | string | true | The domain name (e.g., example.com). |
| region | string | false | Delivery region: "us-east-1", "eu-west-1", or "sa-east-1". |
`,
  },
  github: {
    title: 'GitHub REST API - Repositories and Issues',
    url: 'https://docs.github.com/en/rest',
    markdown: `
# GitHub REST API

The GitHub REST API provides full programmatic control over GitHub resources.
Base URL: \`https://api.github.com\`

## Authentication
Pass a GitHub Personal Access Token in the Authorization header:
\`Authorization: Bearer ghp_your_token\`

## Repositories

### Get a Repository
GET /repos/{owner}/{repo}
Retrieves comprehensive details about a repository.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| owner | string | true | The account owner of the repository. |
| repo | string | true | The name of the repository. |

### List Repository Issues
GET /repos/{owner}/{repo}/issues
Lists issues in a repository. Note: GitHub's REST API considers every pull request an issue.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| owner | string | true | Repository owner. |
| repo | string | true | Repository name. |

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| state | string | false | Filter by state: "open", "closed", or "all". Default: "open". |
| per_page | integer | false | Results per page (max 100). |
| page | integer | false | Page number for pagination. |

### Create an Issue
POST /repos/{owner}/{repo}/issues
Creates a new issue in a repository.

#### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| title | string | true | The title of the issue. |
| body | string | false | The contents of the issue in Markdown. |
| labels | array | false | Labels to associate with this issue. |
| assignees | array | false | Logins for users to assign to this issue. |

## Pull Requests

### Create a Pull Request
POST /repos/{owner}/{repo}/pulls
Creates a new pull request in a repository.

#### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| title | string | true | The title of the new pull request. |
| head | string | true | The name of the branch where your changes are implemented. |
| base | string | true | The name of the branch you want your changes pulled into. |
| body | string | false | The contents of the pull request description. |
`,
  },
  supabase: {
    title: 'Supabase PostgREST & Auth API Reference',
    url: 'https://supabase.com/docs/reference/api',
    markdown: `
# Supabase REST API Reference

Supabase provides an instant RESTful API generated directly from your database schema using PostgREST.
Base URL: \`https://<project-ref>.supabase.co/rest/v1\`

## Headers
\`\`\`http
apikey: <anon-or-service-role-key>
Authorization: Bearer <user-jwt-or-service-key>
Content-Type: application/json
\`\`\`

## Database Tables

### Query Rows
GET /rest/v1/{table_name}
Fetch rows from any PostgreSQL table.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| table_name | string | true | The name of the table to query. |

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| select | string | false | Columns to return, comma separated (e.g. "id,name,created_at"). |
| limit | integer | false | Maximum number of rows to return. |
| order | string | false | Order specification (e.g. "created_at.desc"). |

### Insert Rows
POST /rest/v1/{table_name}
Insert one or more records into a table.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| table_name | string | true | Target table name. |

#### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| payload | object | true | JSON object or array of objects representing rows to insert. |

### Delete Rows
DELETE /rest/v1/{table_name}
Deletes rows matching filter criteria.

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| id | string | false | Filter criterion e.g. "eq.123". |

## Storage

### Upload a File
POST /storage/v1/object/{bucket_id}/{wildcard}
Upload an asset to a storage bucket.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| bucket_id | string | true | The storage bucket name. |
| wildcard | string | true | Relative file path within the bucket. |
`,
  },
  firecrawl: {
    title: 'Firecrawl API Reference - Web Scraping & Crawling',
    url: 'https://docs.firecrawl.dev/api-reference',
    markdown: `
# Firecrawl API Reference

Firecrawl turns entire websites into clean LLM-ready Markdown.
Base URL: \`https://api.firecrawl.dev/v1\` (or local \`http://localhost:3002/v1\`)

## Authentication
\`\`\`http
Authorization: Bearer fc_YOUR_API_KEY
\`\`\`

## Endpoints

### Scrape a URL
POST /v1/scrape
Scrape a single URL and return clean Markdown or structured JSON.

#### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| url | string | true | The URL to scrape. |
| formats | array | false | Output formats: ["markdown", "html", "rawHtml", "screenshot"]. Default: ["markdown"]. |
| onlyMainContent | boolean | false | If true, strip headers, navigation bars, and footers. Default: true. |
| waitFor | integer | false | Time in milliseconds to wait for dynamic JavaScript to render. |

### Crawl Website
POST /v1/crawl
Initiates a background crawl job across all subpages of a website.

#### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| url | string | true | The root URL to start crawling from. |
| limit | integer | false | Maximum number of pages to crawl. Default: 50. |
| maxDepth | integer | false | Maximum crawl link depth. |

### Get Crawl Status
GET /v1/crawl/{id}
Check status and retrieve scraped data from a crawl job.

#### Path Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| id | string | true | The crawl ID returned by POST /v1/crawl. |

### Map Website
POST /v1/map
Quickly extract all URLs belonging to a website domain without scraping full page content.

#### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| url | string | true | The target domain to map. |
| search | string | false | Optional keyword to filter discovered URLs. |
`,
  },
};

/**
 * Identify matching fallback dataset based on URL or keyword
 */
export function getFallbackDataset(target: string): ScrapeResult | null {
  const normalized = target.toLowerCase();
  for (const [key, preset] of Object.entries(POPULAR_FALLBACK_DATASETS)) {
    if (normalized.includes(key) || normalized.includes(preset.title.toLowerCase()) || normalized === key) {
      return {
        url: preset.url,
        title: preset.title,
        markdown: preset.markdown.trim(),
        source: 'demo-fallback',
        statusCode: 200,
        latencyMs: 12,
        metadata: {
          description: `Built-in fallback schema dataset for ${key.toUpperCase()}`,
          language: 'en',
          sourceURL: preset.url,
        },
      };
    }
  }
  return null;
}

/**
 * Main scraper function:
 * 1. Checks if forceFallback is requested or URL is a keyword.
 * 2. Attempts to scrape via Firecrawl-Local.
 * 3. Falls back smoothly if Firecrawl is unreachable or in serverless cloud environments.
 */
export async function scrapeDocumentation(
  targetUrl: string,
  options: ScrapeOptions = {}
): Promise<ScrapeResult> {
  const startTime = Date.now();
  const trimmed = targetUrl.trim();

  // If user passes preset key directly (e.g. "stripe", "resend", "github", "supabase", "firecrawl")
  if (POPULAR_FALLBACK_DATASETS[trimmed.toLowerCase()]) {
    const preset = POPULAR_FALLBACK_DATASETS[trimmed.toLowerCase()]!;
    return {
      url: preset.url,
      title: preset.title,
      markdown: preset.markdown.trim(),
      source: 'demo-fallback',
      statusCode: 200,
      latencyMs: Date.now() - startTime,
      metadata: {
        description: `Preset dataset for ${trimmed}`,
        sourceURL: preset.url,
      },
    };
  }

  if (options.forceFallback) {
    const fallback = getFallbackDataset(trimmed);
    if (fallback) return fallback;
  }

  const firecrawlBaseUrl =
    process.env.NEXT_PUBLIC_FIRECRAWL_LOCAL_URL ||
    process.env.FIRECRAWL_API_URL ||
    'http://localhost:3002';

  const timeoutMs = options.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const endpoint = `${firecrawlBaseUrl.replace(/\/$/, '')}/v1/scrape`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: trimmed,
        formats: options.formats ?? ['markdown'],
        onlyMainContent: options.onlyMainContent ?? true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        const doc = data.data;
        return {
          url: doc.metadata?.url || doc.metadata?.sourceURL || trimmed,
          title: doc.metadata?.title || 'Documentation Page',
          markdown: doc.markdown || doc.content || '',
          source: 'firecrawl-local',
          statusCode: doc.metadata?.statusCode || response.status,
          latencyMs: Date.now() - startTime,
          metadata: doc.metadata,
        };
      }
    }

    console.warn(`[Firecrawl] HTTP ${response.status}: Failed to scrape ${trimmed}`);
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[Firecrawl] Connection failed or timed out (${firecrawlBaseUrl}): ${err.message}`);
  }

  // Graceful Fallback if Firecrawl failed or timed out
  const fallback = getFallbackDataset(trimmed);
  if (fallback) {
    return {
      ...fallback,
      latencyMs: Date.now() - startTime,
    };
  }

  // If no specific preset matched, synthesize a clean fallback structure indicating status
  return {
    url: trimmed,
    title: `Scraped Document: ${trimmed}`,
    markdown: `# API Reference: ${trimmed}\n\nCould not reach Firecrawl service on ${firecrawlBaseUrl}. Please ensure Firecrawl is running locally or select one of the built-in preset APIs (Stripe, Resend, GitHub, Supabase, Firecrawl).`,
    source: 'demo-fallback',
    statusCode: 503,
    latencyMs: Date.now() - startTime,
  };
}
