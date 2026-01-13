import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token');
    const { pathname } = request.nextUrl;

    // 允許訪問的公開路徑
    const publicPaths = [
        '/',
        '/home',
        '/login',
        '/register',
        '/forgot-password'
    ];

    // API 路由都允許訪問
    if (pathname.startsWith('/api/')) {
        return NextResponse.next();
    }

    // 靜態資源路徑
    if (pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/favicon') ||
        pathname.includes('.')) {
        return NextResponse.next();
    }

    // 如果是公開路徑，允許訪問
    if (publicPaths.includes(pathname)) {
        return NextResponse.next();
    }

    // 如果沒有 token，重定向到登入頁面
    if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 有 token，允許訪問
    return NextResponse.next();
}

// 配置 middleware 應用的路徑
export const config = {
    matcher: [
        /*
         * 匹配所有路徑，除了：
         * - api (API routes)
         * - _next/static (靜態文件)
         * - _next/image (圖片優化)
         * - favicon.ico (網站圖標)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
