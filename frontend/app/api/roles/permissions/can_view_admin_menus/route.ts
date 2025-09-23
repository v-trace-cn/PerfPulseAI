import { createApiHandlers } from '@/lib/api-proxy'

const handlers = createApiHandlers({
  apiPrefix: 'roles/permissions/can_view_admin_menus',
  timeout: 10000,
  requireAuth: true
})

export const { GET } = handlers
