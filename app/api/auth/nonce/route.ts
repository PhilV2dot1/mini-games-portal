import { NextResponse } from 'next/server';

const ETHOS_SERVER = 'https://ethos.thebbz.xyz';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const upstream = await fetch(`${ETHOS_SERVER}/api/auth/nonce`, {
    headers: { Accept: 'application/json' },
  });
  const data = await upstream.text();
  return new NextResponse(data, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      ...CORS_HEADERS,
    },
  });
}
