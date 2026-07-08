import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:5000';

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  try {
    const { path } = await params;
    const pathString = path ? path.join('/') : '';
    const targetUrl = `${BACKEND_URL}/api/${pathString}${req.nextUrl.search}`;

    const method = req.method;
    const headers = new Headers();

    // 1. Forward standard headers
    headers.set('Content-Type', req.headers.get('content-type') || 'application/json');

    // 2. Read JWT token from cookies and attach it as Bearer header
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // 3. Handle special Auth endpoints (Login / Register / Logout)
    const isLogin = pathString === 'auth/login';
    const isRegister = pathString === 'auth/register';
    const isLogout = pathString === 'auth/logout';

    if (isLogout) {
      const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
      // Invalidate cookie
      response.cookies.set('token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    // Read body if method allows
    let body: any = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      body = await req.text();
    }

    // 4. Forward request to backend
    const backendResponse = await fetch(targetUrl, {
      method,
      headers,
      body,
    });

    const text = await backendResponse.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error(`BFF Proxy Error - Non-JSON response from backend [URL: ${targetUrl}, Status: ${backendResponse.status}]:`, text.substring(0, 500));
      return NextResponse.json(
        { 
          success: false, 
          message: `Backend error: Received invalid response from server. Status ${backendResponse.status}` 
        },
        { status: backendResponse.status || 502 }
      );
    }

    // 5. Intercept Login responses to set token in cookie
    if (isLogin && backendResponse.ok && data.token) {
      const response = NextResponse.json({
        success: true,
        message: data.message,
        user: data.user,
      });

      // Set cookie (HttpOnly, Secure, SameSite=Lax)
      response.cookies.set('token', data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });

      return response;
    }

    // 6. Return response to client
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('BFF Proxy Error:', (error as Error).message);
    return NextResponse.json(
      { message: 'BFF Proxy error occurred.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, context: any) {
  return handleProxy(req, context);
}

export async function POST(req: NextRequest, context: any) {
  return handleProxy(req, context);
}

export async function PUT(req: NextRequest, context: any) {
  return handleProxy(req, context);
}

export async function PATCH(req: NextRequest, context: any) {
  return handleProxy(req, context);
}

export async function DELETE(req: NextRequest, context: any) {
  return handleProxy(req, context);
}
