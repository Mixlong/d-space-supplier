const ALL_PERMISSION = '*:*:*'
const ADMIN_ROLES = new Set(['admin', 'super_admin', 'superadmin', 'role_admin'])

export function normalizePermissions(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item ?? '').trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(Boolean)
  }
  return []
}

export function hasPermission(required, permissions = [], roles = []) {
  const requiredPermissions = normalizePermissions(required)
  if (!requiredPermissions.length) return true

  const grantedPermissions = normalizePermissions(permissions)
  const grantedRoles = normalizePermissions(roles).map(role => role.toLowerCase())

  return grantedRoles.some(role => ADMIN_ROLES.has(role)) || grantedPermissions.some(permission => {
    return permission === ALL_PERMISSION || requiredPermissions.includes(permission)
  })
}

export function hasRoutePermission(route, userStore) {
  return hasPermission(
    route?.permissions ?? route?.meta?.permissions,
    userStore?.permissions,
    userStore?.roles,
  )
}

export function isRouteAccessible(route, userStore) {
  return (route?.matched || []).every(record => hasRoutePermission(record, userStore))
}

export function filterAccessibleRoutes(routes, userStore) {
  if (!Array.isArray(routes)) return []

  return routes.reduce((result, route) => {
    if (route.hidden || !hasRoutePermission(route, userStore)) return result

    const children = Array.isArray(route.children)
      ? filterAccessibleRoutes(route.children, userStore)
      : []

    if (Array.isArray(route.children) && children.length === 0) return result

    result.push({ ...route, ...(Array.isArray(route.children) ? { children } : {}) })
    return result
  }, [])
}

export function getFirstAccessiblePath(routes, userStore, parentPath = '') {
  for (const route of routes || []) {
    if (route.hidden || !hasRoutePermission(route, userStore)) continue

    const path = resolveRoutePath(parentPath, route.path)
    const childPath = getFirstAccessiblePath(route.children, userStore, path)
    if (childPath) return childPath
    if (!route.children?.length) return path
  }
  return ''
}

export function getDefaultAccessiblePath(routes, userStore) {
  const visibleRoutes = filterAccessibleRoutes(routes, userStore).filter(route => {
    return route.path !== '/bluetooth' || userStore?.bluetoothConfigStatus === 1
  })
  return getFirstAccessiblePath(visibleRoutes, userStore)
}

function resolveRoutePath(parentPath, routePath = '') {
  if (routePath.startsWith('/')) return routePath
  const base = parentPath.endsWith('/') ? parentPath.slice(0, -1) : parentPath
  return `${base}/${routePath}`.replace(/\/{2,}/g, '/')
}
