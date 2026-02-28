import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const adminSession = request.cookies.get('admin_session');

  if (adminSession?.value === 'authenticated') {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
