/**
 * 统一的商城 API 代理路由
 * 
 * 支持的路径：
 * - GET/POST /api/mall - 基础商城操作（带 action 参数）
 * - GET/POST /api/mall/items - 商品管理
 * - GET/PUT/DELETE /api/mall/items/{itemId} - 商品详情操作
 * - PUT /api/mall/items/{itemId}/stock - 库存管理
 * - GET /api/mall/admin/* - 管理员相关操作
 * - GET /api/mall/analytics/* - 分析数据
 * - GET /api/mall/purchases/* - 购买记录
 * - GET /api/mall/search/* - 搜索功能
 * - GET /api/mall/statistics/* - 统计数据
 */

import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, proxyToBackendWithParams, PROXY_CONFIGS } from '@/lib/api-proxy'

interface RouteContext {
  params: Promise<{
    path: string[]
  }>
}

/**
 * 解析商城路径并路由到对应的处理函数
 */
function parseMallPath(path: string[], method: string): {
  type: string
  endpoint: string
  params: Record<string, string>
} | null {
  // 空路径或根路径: /api/mall
  if (!path || path.length === 0) {
    return {
      type: 'mall_root',
      endpoint: '/api/mall',
      params: {}
    }
  }

  const [first, second, third, fourth] = path

  // /api/mall/items
  if (first === 'items' && !second) {
    return {
      type: 'mall_items',
      endpoint: '/api/mall/items',
      params: {}
    }
  }

  // /api/mall/items/{itemId}
  if (first === 'items' && second && !third) {
    return {
      type: 'mall_item_detail',
      endpoint: '/api/mall/items/{itemId}',
      params: { itemId: second }
    }
  }

  // /api/mall/items/public
  if (first === 'items' && second === 'public' && !third) {
    return {
      type: 'mall_items_public',
      endpoint: '/api/mall/items/public',
      params: {}
    }
  }

  // /api/mall/items/{itemId}/stock
  if (first === 'items' && second && third === 'stock') {
    return {
      type: 'mall_item_stock',
      endpoint: '/api/mall/admin/items/{itemId}/stock',
      params: { itemId: second }
    }
  }

  // /api/mall/purchases
  if (first === 'purchases' && !second) {
    return {
      type: 'mall_purchases',
      endpoint: '/api/mall/purchases',
      params: {}
    }
  }

  // /api/mall/purchase
  if (first === 'purchase' && !second) {
    return {
      type: 'mall_purchase',
      endpoint: '/api/mall/purchase',
      params: {}
    }
  }

  // /api/mall/analytics
  if (first === 'analytics') {
    const analyticsPath = path.slice(1).join('/')
    return {
      type: 'mall_analytics',
      endpoint: analyticsPath ? `/api/mall/analytics/${analyticsPath}` : '/api/mall/analytics',
      params: {}
    }
  }

  // /api/mall/verify-redemption-code
  if (first === 'verify-redemption-code' && !second) {
    return {
      type: 'mall_verify_redemption',
      endpoint: '/api/mall/verify-redemption-code',
      params: {}
    }
  }

  // /api/mall/redeem-code
  if (first === 'redeem-code' && !second) {
    return {
      type: 'mall_redeem_code',
      endpoint: '/api/mall/redeem-code',
      params: {}
    }
  }

  // /api/mall/admin/*
  if (first === 'admin') {
    const adminPath = path.slice(1).join('/')
    return {
      type: 'mall_admin',
      endpoint: `/api/mall/admin/${adminPath}`,
      params: {}
    }
  }

  // /api/mall/analytics/*
  if (first === 'analytics') {
    const analyticsPath = path.slice(1).join('/')
    return {
      type: 'mall_analytics',
      endpoint: `/api/mall/analytics/${analyticsPath}`,
      params: {}
    }
  }

  // /api/mall/purchases/*
  if (first === 'purchases') {
    const purchasesPath = path.slice(1).join('/')
    return {
      type: 'mall_purchases',
      endpoint: `/api/mall/purchases/${purchasesPath}`,
      params: {}
    }
  }

  // /api/mall/search/*
  if (first === 'search') {
    const searchPath = path.slice(1).join('/')
    return {
      type: 'mall_search',
      endpoint: `/api/mall/search/${searchPath}`,
      params: {}
    }
  }

  // /api/mall/statistics/*
  if (first === 'statistics') {
    const statisticsPath = path.slice(1).join('/')
    return {
      type: 'mall_statistics',
      endpoint: `/api/mall/statistics/${statisticsPath}`,
      params: {}
    }
  }

  // /api/mall/recommendations/*
  if (first === 'recommendations') {
    const recommendationsPath = path.slice(1).join('/')
    return {
      type: 'mall_recommendations',
      endpoint: `/api/mall/recommendations/${recommendationsPath}`,
      params: {}
    }
  }

  // 未知路径
  return null
}

export async function GET(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const { path } = params

  // 添加调试日志
  console.log('🔄 Mall API GET request:', {
    url: request.url,
    path: path,
    pathLength: path?.length
  })

  const route = parseMallPath(path, 'GET')

  console.log('🔍 Mall route parsing result:', {
    path: path,
    route: route
  })

  if (!route) {
    console.log('❌ No route found for path:', path)
    return NextResponse.json(
      { success: false, message: '未找到对应的商城API路径' },
      { status: 404 }
    )
  }

  try {
    switch (route.type) {
      case 'mall_root':
        // GET /api/mall - 基础商城操作（保持现有逻辑）
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '商城操作失败' }
        )

      case 'mall_items':
        // GET /api/mall/items - 商品列表
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '获取商品列表失败' }
        )

      case 'mall_items_public':
        // GET /api/mall/items/public - 公开商品列表
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '获取公开商品列表失败' }
        )

      case 'mall_item_detail':
        // GET /api/mall/items/{itemId} - 商品详情
        return proxyToBackendWithParams(
          request,
          route.endpoint,
          route.params,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '获取商品详情失败' }
        )

      case 'mall_purchases':
        // GET /api/mall/purchases - 购买记录
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '获取购买记录失败' }
        )

      case 'mall_admin':
      case 'mall_analytics':
      case 'mall_search':
      case 'mall_statistics':
      case 'mall_recommendations':
        // 其他商城相关操作
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '商城操作失败' }
        )

      default:
        return NextResponse.json(
          { success: false, message: '不支持的GET操作' },
          { status: 405 }
        )
    }
  } catch (error) {
    console.error('商城API GET请求错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const { path } = params
  const route = parseMallPath(path, 'POST')

  if (!route) {
    return NextResponse.json(
      { success: false, message: '未找到对应的商城API路径' },
      { status: 404 }
    )
  }

  try {
    switch (route.type) {
      case 'mall_root':
        // POST /api/mall - 基础商城操作（保持现有逻辑）
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '商城操作失败' }
        )

      case 'mall_items':
        // POST /api/mall/items - 创建商品 (需要映射到 admin 路径)
        return proxyToBackend(
          request,
          '/api/mall/admin/items',
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '创建商品失败' }
        )

      case 'mall_purchase':
        // POST /api/mall/purchase - 购买商品
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '购买商品失败' }
        )

      case 'mall_verify_redemption':
        // POST /api/mall/verify-redemption-code - 验证兑换码
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '验证兑换码失败' }
        )

      case 'mall_redeem_code':
        // POST /api/mall/redeem-code - 使用兑换码
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '兑换码使用失败' }
        )

      case 'mall_admin':
      case 'mall_analytics':
      case 'mall_search':
      case 'mall_statistics':
      case 'mall_recommendations':
        // 其他商城相关操作
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '商城操作失败' }
        )

      default:
        return NextResponse.json(
          { success: false, message: '不支持的POST操作' },
          { status: 405 }
        )
    }
  } catch (error) {
    console.error('商城API POST请求错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const { path } = params
  const route = parseMallPath(path, 'PUT')

  if (!route) {
    return NextResponse.json(
      { success: false, message: '未找到对应的商城API路径' },
      { status: 404 }
    )
  }

  try {
    switch (route.type) {
      case 'mall_item_detail':
        // PUT /api/mall/items/{itemId} - 更新商品 (需要映射到 admin 路径)
        return proxyToBackendWithParams(
          request,
          '/api/mall/admin/items/{itemId}',
          route.params,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '更新商品失败' }
        )

      case 'mall_item_stock':
        // PUT /api/mall/items/{itemId}/stock - 更新库存 (需要映射到 admin 路径)
        return proxyToBackendWithParams(
          request,
          '/api/mall/admin/items/{itemId}/stock',
          route.params,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '更新库存失败' }
        )

      case 'mall_admin':
        // 其他管理员操作
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '商城操作失败' }
        )

      default:
        return NextResponse.json(
          { success: false, message: '不支持的PUT操作' },
          { status: 405 }
        )
    }
  } catch (error) {
    console.error('商城API PUT请求错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params
  const { path } = params
  const route = parseMallPath(path, 'DELETE')

  if (!route) {
    return NextResponse.json(
      { success: false, message: '未找到对应的商城API路径' },
      { status: 404 }
    )
  }

  try {
    switch (route.type) {
      case 'mall_item_detail':
        // DELETE /api/mall/items/{itemId} - 删除商品 (需要映射到 admin 路径)
        return proxyToBackendWithParams(
          request,
          '/api/mall/admin/items/{itemId}',
          route.params,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '删除商品失败' }
        )

      case 'mall_admin':
        // 其他管理员操作
        return proxyToBackend(
          request,
          route.endpoint,
          { ...PROXY_CONFIGS.STANDARD, errorMessage: '商城操作失败' }
        )

      default:
        return NextResponse.json(
          { success: false, message: '不支持的DELETE操作' },
          { status: 405 }
        )
    }
  } catch (error) {
    console.error('商城API DELETE请求错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
