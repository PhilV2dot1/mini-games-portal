import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://mini-games-portal.vercel.app';
const siteTitle = 'Mini Games Portal — 20 Games, Free & On-Chain';
const siteDescription = '🎮 Play 20 mini-games on Celo, Base, MegaETH & Soneium — for free or on-chain! Blackjack, Poker, Snake, Tetris, Wordle, Flappy Bird, Minesweeper, Solitaire, Yahtzee, Sudoku, Mastermind, Connect 5, Maze, Memory, 2048, Plinko, RPS, Tic-Tac-Toe, Jackpot & Brick Breaker. Multiplayer & leaderboard included!';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FCFF52' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MiniGames',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: 'Mini Games Portal',
    type: 'website',
    locale: 'en_US',
    images: [{ url: `${siteUrl}/api/og`, width: 1200, height: 630, alt: 'Mini Games Portal — 20 mini-games on blockchain' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: [`${siteUrl}/api/og`],
  },
  other: {
    'fc:frame': JSON.stringify({
      version: 'next',
      imageUrl: `${siteUrl}/api/og`,
      button: {
        title: '🎮 Play Now',
        action: {
          type: 'launch_frame',
          name: 'Mini Games Portal',
          url: siteUrl,
          splashImageUrl: `${siteUrl}/icon-192.png`,
          splashBackgroundColor: '#FCFF52',
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased has-bottom-nav`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
