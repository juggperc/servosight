import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
        const authCookie = request.cookies.get('admin-auth')

        // Strict password check
        if (authCookie?.value !== '67ForJohnP0rk=') {
            const url = request.nextUrl.clone()
            url.pathname = '/admin/login'
            return NextResponse.redirect(url, { status: 302 })
        }
    }
    return NextResponse.next()
}

export const config = {
    matcher: '/admin/:path*',
}
