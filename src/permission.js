import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import router, { constantRoutes } from '@/router'
import store from '@/store'
import { getToken } from '@/utils/auth'
import useUserStore from '@/store/modules/user'
import { getDefaultAccessiblePath, isRouteAccessible } from '@/utils/permission'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login']

function canAccessRoute(to, userStore) {
  if (to.path === '/401' || to.path === '/login') return true
  if (!isRouteAccessible(to, userStore)) return false
  if (to.path.startsWith('/bluetooth') && userStore.bluetoothConfigStatus !== 1) return false
  return true
}

function goToDefaultRoute(next, userStore, redirect = '') {
  const path = getDefaultAccessiblePath(constantRoutes, userStore)
  if (!path) {
    next({
      path: '/401',
      query: redirect ? { redirect } : {},
      replace: true,
    })
    NProgress.done()
    return
  }
  next({ path, replace: true })
}

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  const userStore = useUserStore(store)
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
      return
    }

    if (userStore.isInfoFetched) {
      if (!userStore.isBluetoothConfigFetched) {
        await userStore.getBluetoothConfig().catch(() => 0)
      }
      if (to.path.startsWith('/bluetooth') && userStore.bluetoothConfigStatus !== 1) {
        goToDefaultRoute(next, userStore, to.fullPath)
        return
      }
      if (!canAccessRoute(to, userStore)) {
        goToDefaultRoute(next, userStore, to.fullPath)
        return
      }
      if (to.path === '/') {
        goToDefaultRoute(next, userStore)
        return
      }
      next()
      return
    }

    try {
      await userStore.getInfo()
      if (to.path.startsWith('/bluetooth') && userStore.bluetoothConfigStatus !== 1) {
        goToDefaultRoute(next, userStore, to.fullPath)
        return
      }
      if (!canAccessRoute(to, userStore)) {
        goToDefaultRoute(next, userStore, to.fullPath)
        return
      }
      if (to.path === '/') {
        goToDefaultRoute(next, userStore)
        return
      }
      next({ ...to, replace: true })
    } catch (error) {
      await userStore.logOut()
      next(`/login?redirect=${to.fullPath}`)
      NProgress.done()
    }
    return
  }

  if (whiteList.includes(to.path)) {
    next()
  } else {
    next(`/login?redirect=${to.fullPath}`)
    NProgress.done()
  }
})

router.afterEach(() => {
  NProgress.done()
})
