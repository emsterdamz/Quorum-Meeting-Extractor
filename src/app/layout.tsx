import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Quorum — Turn meetings into clean next steps",
  description:
    "Turn messy meeting transcripts into a clean summary, key decisions, assigned action items, and type-safe JSON.",
  applicationName: "Quorum",
  keywords: [
    "meeting notes",
    "action items",
    "transcript summary",
    "structured outputs",
    "meeting intelligence",
  ],
  openGraph: {
    title: "Quorum — Turn meetings into clean next steps",
    description:
      "A meeting and action-item extractor with schema-locked JSON output.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#f2eee5",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
