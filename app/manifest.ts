import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mini Games Portal',
    short_name: 'MiniGames',
    description: 'Play 20 mini-games on Celo, Base, MegaETH & Soneium. Free mode, on-chain, and multiplayer.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#111827',
    theme_color: '#FCFF52',
    categories: ['games', 'entertainment'],
    lang: 'en',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Play Blackjack',
        url: '/blackjack',
        icons: [{ src: '/icons/blackjack.png', sizes: '96x96' }],
      },
      {
        name: 'Play Snake',
        url: '/games/snake',
        icons: [{ src: '/icons/snake.png', sizes: '96x96' }],
      },
      {
        name: 'Play Poker',
        url: '/games/poker',
        icons: [{ src: '/icons/poker.svg', sizes: 'any' }],
      },
    ],
  };
}
