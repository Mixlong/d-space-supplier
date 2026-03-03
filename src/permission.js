import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import router from '@/router'
import store from '@/store'
import { getToken } from '@/utils/auth'
import useUserStore from '@/store/modules/user'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login']

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

    if (userStore.roles && userStore.roles.length > 0) {
      next()
      return
    }

    try {
      await userStore.getInfo()
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
