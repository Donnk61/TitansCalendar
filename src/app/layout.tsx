import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter, Montserrat } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://titans-calendar.vercel.app"),
  title: {
    default: "TITANS Cronograma",
    template: "%s | TITANS Cronograma",
  },
  description: "Calendario publico do semestre da equipe TITANS.",
  applicationName: "TITANS Cronograma",
  authors: [{ name: "TITANS UnB" }],
  category: "calendar",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/titans-logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon-32.png"],
  },
  openGraph: {
    title: "TITANS Cronograma",
    description: "Calendario publico do semestre da equipe TITANS.",
    url: "https://titans-calendar.vercel.app",
    siteName: "TITANS Cronograma",
    images: [
      {
        url: "/titans-og.png",
        width: 1200,
        height: 630,
        alt: "Logo da equipe TITANS e titulo TITANS Cronograma",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TITANS Cronograma",
    description: "Calendario publico do semestre da equipe TITANS.",
    images: ["/titans-og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#151211",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${montserrat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
