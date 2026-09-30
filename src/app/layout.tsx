import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trak // Dynamic Train ETA Forecast',
  description:
    'Dynamic Forecast of Expected Time of Arrival (ETA) for Coaching Trains using Block Signaling Telemetry & Timetable Recovery Slack Subtraction.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-void text-zinc-300 font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
