import request from '@/utils/request'

export function login(username, password, code, uuid) {
  return request.post('/login', { username, password, code, uuid })
}

export function getCaptcha() {
  return request.get('/captchaImage', { headers: { isToken: false } })
}

export function getInfo() {
  return request.get('/getInfo')
}

export function logout() {
  return request.post('/logout')
}
