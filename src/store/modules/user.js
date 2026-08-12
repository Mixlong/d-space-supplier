import { defineStore } from 'pinia'
import { login, logout, getInfo } from '@/api/login'
import { getVendorBluetoothConfig } from '@/api/vendor-bluetooth'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { isHttp, isEmpty } from '@/utils/validate'

const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    id: '',
    name: '',
    nickName: '',
    avatar: '',
    roles: [],
    permissions: [],
    isInfoFetched: false,
    bluetoothConfigStatus: 0,
    isBluetoothConfigFetched: false
  }),
  actions: {
    login(userInfo) {
      const username = userInfo.username.trim()
      const password = userInfo.password
      const code = userInfo.code
      return new Promise((resolve, reject) => {
        login(username, password, code)
          .then(res => {
            if (!res || Number(res.code) !== 200) {
              reject(new Error(res?.msg || '登录失败'))
              return
            }
            const token = res.token || res.data?.token || ''
            if (token) {
              setToken(token)
            }
            this.token = token
            resolve()
          })
          .catch(error => {
            reject(error)
          })
      })
    },
    getBluetoothConfig() {
      return getVendorBluetoothConfig()
        .then(res => {
          const status = res?.data?.bluetoothConfigStatus ?? res?.data ?? res?.bluetoothConfigStatus ?? 0
          this.bluetoothConfigStatus = Number(status) === 1 ? 1 : 0
          this.isBluetoothConfigFetched = true
          return this.bluetoothConfigStatus
        })
        .catch(() => {
          this.bluetoothConfigStatus = 0
          this.isBluetoothConfigFetched = true
          return 0
        })
    },
    getInfo() {
      return new Promise((resolve, reject) => {
        Promise.all([getInfo(), this.getBluetoothConfig().catch(() => 0)])
          .then(([res]) => {
            const user = res.user
            let avatar = user.avatar || ''
            if (!isHttp(avatar)) {
              avatar = isEmpty(avatar) ? '' : import.meta.env.VITE_APP_BASE_API + avatar
            }
            if (res.roles && res.roles.length > 0) {
              this.roles = res.roles
              this.permissions = Array.isArray(res.permissions) ? res.permissions : []
            } else {
              this.roles = []
              this.permissions = Array.isArray(res.permissions) ? res.permissions : []
            }
            this.id = user.userId || user.id || ''
            this.name = user.userName || user.username || user.name || ''
            this.nickName = user.nickName || user.nickname || user.realName || this.name
            this.avatar = avatar
            this.isInfoFetched = true
            resolve(res)
          })
          .catch(error => {
            reject(error)
          })
      })
    },
    logOut() {
      const clearLocalState = () => {
        this.token = ''
        this.roles = []
        this.permissions = []
        this.isInfoFetched = false
        this.bluetoothConfigStatus = 0
        this.isBluetoothConfigFetched = false
        removeToken()
        sessionStorage.clear()
      }

      return new Promise((resolve) => {
        logout(this.token)
          .catch(() => {
            // 后端不可达时仍允许前端完成退出，避免界面卡住
          })
          .finally(() => {
            clearLocalState()
            resolve()
          })
      })
    }
  }
})

export default useUserStore
export { useUserStore }
