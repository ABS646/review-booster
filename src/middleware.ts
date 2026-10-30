import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the country from Vercel's headers (defaults to US if running locally)
  const country = request.headers.get('x-vercel-ip-country') || 'US';
  
  const response = NextResponse.next();
  
  // Set a cookie so the frontend can read the country
  response.cookies.set('user-country', country, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  return response;
}

// Only run this middleware on the dashboard and login pages
export const config = {
  matcher: ['/', '/dashboard/:path*', '/login'],
};