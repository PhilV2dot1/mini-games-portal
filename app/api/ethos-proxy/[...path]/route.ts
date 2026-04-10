import { NextRequest, NextResponse } from 'next/server';

const ETHOS_SERVER = 'https://ethos.thebbz.xyz';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

async function proxy(request: NextRequest, params: { path: string[] }) {
  const path = '/' + params.path.join('/');
  const url = new URL(path, ETHOS_SERVER);

  // Forward query params
  request.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };
  const auth = request.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;

  const body = request.method !== 'GET' && request.method !== 'HEAD'
    ? await request.text()
    : undefined;

  const upstream = await fetch(url.toString(), {
    method: request.method,
    headers,
    body,
  });

  const data = await upstream.text();
  console.log(`[ethos-proxy] ${request.method} ${url.toString()} → ${upstream.status}: ${data.substring(0, 500)}`);
  return new NextResponse(data, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(request, await params);
}
