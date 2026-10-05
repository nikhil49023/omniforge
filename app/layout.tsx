import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniForge - Autonomous MCP Server Generator',
  description: 'Turn any API documentation into production-ready FastMCP Python and TypeScript servers in seconds with Groq and Firecrawl.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        {children}
      </body>
    </html>
  );
}
