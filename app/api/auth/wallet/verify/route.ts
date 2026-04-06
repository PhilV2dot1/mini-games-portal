import { NextRequest, NextResponse } from 'next/server';

const ETHOS_SERVER = 'https://ethos.thebbz.xyz';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const upstream = await fetch(`${ETHOS_SERVER}/api/auth/wallet/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body,
  });
  const data = await upstream.text();
  console.log(`[ethos-wallet-verify] → ${upstream.status}: ${data.substring(0, 500)}`);
  return new NextResponse(data, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      ...CORS_HEADERS,
    },
  });
}
