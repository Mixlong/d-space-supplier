import request from '@/utils/request'

export function login(username, password, code) {
  return request.post('/login', { username, password, code })
}

export function sendSmsCode(username) {
  return request.post('/sms/send', { username }, { headers: { isToken: false } })
}

export function getInfo() {
  return request.get('/getInfo')
}

export function logout() {
  return request.post('/logout')
}
