import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js 路由守卫中间件
 *
 * 功能：
 * 1. 保护需要认证的路由（/home, /projects, /tasks 等）
 * 2. 已登录用户访问登录页自动跳转到主页
 * 3. 未登录用户访问受保护路由自动跳转到登录页
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 从 Cookie 获取 longi_session (后端使用 Cookie-based Session 认证)
  const sessionToken = request.cookies.get('longi_session')?.value
  const isAuthenticated = !!sessionToken
  console.log('[Middleware] Session Token:', sessionToken ? '存在' : '不存在', 'isAuthenticated:', isAuthenticated)
  
  // 定义公开路由（无需认证）
  const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/verify', '/reset-sent']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // 定义受保护的路由（需要认证）
  const protectedRoutes = ['/home', '/projects', '/tasks', '/approvals', '/my-work', '/knowledge-graph']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  console.log('[Middleware]', {
    pathname,
    isAuthenticated,
    isPublicRoute,
    isProtectedRoute,
  })

  // 场景 1: 未登录访问受保护路由 → 重定向到登录页
  if (!isAuthenticated && isProtectedRoute) {
    console.log('[Middleware] 未登录访问受保护路由，重定向到登录页')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname) // 记录原始路径，登录后跳转回来
    return NextResponse.redirect(loginUrl)
  }

  // 场景 2: 已登录访问公开路由 → 重定向到主页
  if (isAuthenticated && isPublicRoute) {
    console.log('[Middleware] 已登录访问公开路由，重定向到主页')
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // 场景 3: 访问根路径 → 根据登录状态重定向
  if (pathname === '/') {
    if (isAuthenticated) {
      console.log('[Middleware] 访问根路径，已登录，重定向到主页')
      return NextResponse.redirect(new URL('/home', request.url))
    } else {
      console.log('[Middleware] 访问根路径，未登录，重定向到登录页')
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 允许通过
  return NextResponse.next()
}

/**
 * Matcher 配置
 * 匹配所有路由，但排除：
 * - /api/* (API 路由)
 * - /_next/static/* (静态文件)
 * - /_next/image/* (图片优化)
 * - /favicon.ico (网站图标)
 * - 其他静态资源
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
