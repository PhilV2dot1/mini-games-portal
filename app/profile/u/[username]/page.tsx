import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicProfileClient from './PublicProfileClient';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} — Celo Games Portal`,
    description: `View ${username}'s game stats and badges on Celo Games Portal`,
    openGraph: {
      title: `${username} — Celo Games Portal`,
      description: `Check out ${username}'s profile on Celo Games Portal`,
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;

  // Server-side fetch to check existence and get initial data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  let initialData = null;

  try {
    const res = await fetch(`${baseUrl}/api/user/profile?username=${encodeURIComponent(username)}`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      initialData = await res.json();
    } else if (res.status === 404) {
      notFound();
    }
  } catch {
    // Will be handled client-side
  }

  return <PublicProfileClient username={username} initialData={initialData} />;
}
