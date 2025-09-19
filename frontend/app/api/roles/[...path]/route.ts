/**
 * 统一的角色管理 API 路由
 * 
 * 支持的路径：
 * - GET/POST /api/roles - 角色列表和创建
 * - GET/PUT/DELETE /api/roles/{roleId} - 角色详情、更新、删除
 * - GET /api/roles/{roleId}/members - 角色成员列表
 * - GET /api/roles/users/{userId}/roles - 用户角色列表
 * - PUT /api/roles/users/{userId}/roles - 更新用户角色
 * - GET /api/roles/permissions/can_view_admin_menus - 管理菜单权限检查
 * - GET /api/roles/permissions/check - 权限检查
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, proxyToBackendWithParams, PROXY_CONFIGS } from '@/lib/api-proxy'

interface RouteContext {
  params: Promise<{
    path: string[]
  }>
}

/**
 * 解析路径并路由到对应的处理函数
 */
function parseRolePath(path: string[]): {
  type: string
  endpoint: string
  params: Record<string, string>
} | null {
  // 空路径或根路径: /api/roles
  if (!path || path.length === 0) {
    return {
      type: 'roles',
      endpoint: '/api/roles',
      params: {}
    }
  }

  const [first, second, third] = path

  // /api/roles/permissions/can_view_admin_menus
  if (first === 'permissions' && second === 'can_view_admin_menus') {
    return {
      type: 'admin_menus_permission',
      endpoint: '/api/roles/permissions/can_view_admin_menus',
      params: {}
    }
  }

  // /api/roles/permissions/check
  if (first === 'permissions' && second === 'check') {
    return {
      type: 'permission_check',
      endpoint: '/api/roles/permissions/check',
      params: {}
    }
  }

  // /api/roles/users/{userId}/roles
  if (first === 'users' && third === 'roles' && second) {
    return {
      type: 'user_roles',
      endpoint: '/api/roles/users/{userId}/roles',
      params: { userId: second }
    }
  }

  // /api/roles/{roleId}/members
  if (second === 'members' && first) {
    return {
      type: 'role_members',
      endpoint: '/api/roles/{roleId}/members',
      params: { roleId: first }
    }
  }

  // /api/roles/{roleId}
  if (first && !second) {
    return {
      type: 'role_detail',
      endpoint: '/api/roles/{roleId}',
      params: { roleId: first }
    }
  }

  // 未知路径
  return null
}

/**
 * 验证必需的查询参数
 */
function validateRequiredParams(request: NextRequest, requiredParams: string[]): NextResponse | null {
  const { searchParams } = new URL(request.url)
  
  for (const param of requiredParams) {
    if (!searchParams.get(param)) {
      return NextResponse.json(
        { success: false, message: `缺少必需参数: ${param}` },
        { status: 400 }
      )
    }
  }
  
  return null
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const { path } = params
  const route = parseRolePath(path)

  if (!route) {
    return NextResponse.json(
      { success: false, message: '未找到对应的API路径' },
      { status: 404 }
    )
  }

  try {
    switch (route.type) {
      case 'roles':
        // GET /api/roles - 角色列表
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.ROLES, errorMessage: '获取角色列表失败' }
        )

      case 'role_detail':
        // GET /api/roles/{roleId} - 角色详情
        return proxyToBackendWithParams(
          request,
          route.endpoint,
          route.params,
          { ...PROXY_CONFIGS.ROLES, errorMessage: '获取角色详情失败' }
        )

      case 'role_members':
        // GET /api/roles/{roleId}/members - 角色成员列表
        return proxyToBackendWithParams(
          request,
          route.endpoint,
          route.params,
          { ...PROXY_CONFIGS.ROLES, errorMessage: '获取角色成员失败' }
        )

      case 'user_roles':
        // GET /api/roles/users/{userId}/roles - 用户角色列表
        return proxyToBackendWithParams(
          request,
          route.endpoint,
          route.params,
          { ...PROXY_CONFIGS.ROLES, errorMessage: '获取用户角色失败' }
        )

      case 'admin_menus_permission':
        // GET /api/roles/permissions/can_view_admin_menus - 管理菜单权限检查
        const companyIdError = validateRequiredParams(request, ['companyId'])
        if (companyIdError) return companyIdError

        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.PERMISSIONS, errorMessage: '管理菜单权限检查失败' }
        )

      case 'permission_check':
        // GET /api/roles/permissions/check - 权限检查
        const permissionError = validateRequiredParams(request, ['permission'])
        if (permissionError) return permissionError

        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.PERMISSIONS, errorMessage: '权限检查失败' }
        )

      default:
        return NextResponse.json(
          { success: false, message: '不支持的GET操作' },
          { status: 405 }
        )
    }
  } catch (error) {
    console.error('角色API GET请求错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const { path } = params
  const route = parseRolePath(path)

  if (!route) {
    return NextResponse.json(
      { success: false, message: '未找到对应的API路径' },
      { status: 404 }
    )
  }

  try {
    switch (route.type) {
      case 'roles':
        // POST /api/roles - 创建角色
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.ROLES, errorMessage: '创建角色失败' }
        )

      default:
        return NextResponse.json(
          { success: false, message: '不支持的POST操作' },
          { status: 405 }
        )
    }
  } catch (error) {
    console.error('角色API POST请求错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const { path } = params
  const route = parseRolePath(path)

  if (!route) {
    return NextResponse.json(
      { success: false, message: '未找到对应的API路径' },
      { status: 404 }
    )
  }

  try {
    switch (route.type) {
      case 'role_detail':
        // PUT /api/roles/{roleId} - 更新角色
        return proxyToBackendWithParams(
          request,
          route.endpoint,
          route.params,
          { ...PROXY_CONFIGS.ROLES, errorMessage: '更新角色失败' }
        )

      case 'user_roles':
        // PUT /api/roles/users/{userId}/roles - 更新用户角色
        return proxyToBackendWithParams(
          request,
          route.endpoint,
          route.params,
          { ...PROXY_CONFIGS.ROLES, errorMessage: '更新用户角色失败' }
        )

      default:
        return NextResponse.json(
          { success: false, message: '不支持的PUT操作' },
          { status: 405 }
        )
    }
  } catch (error) {
    console.error('角色API PUT请求错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const { path } = params
  const route = parseRolePath(path)

  if (!route) {
    return NextResponse.json(
      { success: false, message: '未找到对应的API路径' },
      { status: 404 }
    )
  }

  try {
    switch (route.type) {
      case 'role_detail':
        // DELETE /api/roles/{roleId} - 删除角色
        return proxyToBackendWithParams(
          request,
          route.endpoint,
          route.params,
          { ...PROXY_CONFIGS.ROLES, errorMessage: '删除角色失败' }
        )

      default:
        return NextResponse.json(
          { success: false, message: '不支持的DELETE操作' },
          { status: 405 }
        )
    }
  } catch (error) {
    console.error('角色API DELETE请求错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
