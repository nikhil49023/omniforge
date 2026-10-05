import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aether-Void: JEV Chrono-Interceptor | 3D Sci-Fi Space Combat',
  description:
    'Outer space sci-fi fantasy 3D flight combat game powered by Three.js WebGL and JEV System 1 Tactical Space Co-Pilot (<16ms).',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-cyan-500/30 selection:text-cyan-200 bg-[#02040a]">
        {children}
      </body>
    </html>
  );
}
