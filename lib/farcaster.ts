import sdk from "@farcaster/miniapp-sdk";

export function isFarcasterContext(): boolean {
  if (typeof window === "undefined") return false;
  return (
    (window as Window & { fc?: unknown; farcaster?: unknown }).fc !== undefined ||
    (window as Window & { fc?: unknown; farcaster?: unknown }).farcaster !== undefined ||
    document.referrer.includes("warpcast.com")
  );
}

export async function initializeFarcaster(): Promise<boolean> {
  try {
    // ALWAYS call ready() to dismiss splash screen
    await sdk.actions.ready();

    if (!isFarcasterContext()) {
      console.log("Not in Farcaster context, SDK ready but features disabled");
      return false;
    }

    console.log("Farcaster SDK initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize Farcaster SDK:", error);
    // Fallback: still try to dismiss splash
    try {
      await sdk.actions.ready();
    } catch (readyError) {
      console.error("Failed to call ready():", readyError);
    }
    return false;
  }
}

export async function shareGameResult(
  gameName: string,
  outcome: string,
  stats: { played: number; wins: number },
  appUrl: string
) {
  const emojis: Record<string, string> = {
    win: '🎉',
    lose: '😢',
    draw: '🤝',
    push: '🤝'
  };

  const text = `I just played ${gameName} on Celo Games Portal!\n\n${emojis[outcome] || '🎮'} ${outcome.toUpperCase()}\n\nStats: ${stats.wins}W / ${stats.played - stats.wins}L\n\nPlay now:`;

  const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(appUrl)}`;

  if (!isFarcasterContext()) {
    window.open(shareUrl, "_blank");
    return;
  }

  try {
    await sdk.actions.openUrl(shareUrl);
  } catch (error) {
    console.error("Failed to open Farcaster share URL:", error);
    window.open(shareUrl, "_blank");
  }
}
