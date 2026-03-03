import request from '@/utils/request'

export function getMyPurchaseOrders(params) {
  return request({
    url: '/vendor/delivery/myPurchaseOrders',
    method: 'get',
    params
  })
}

export function submitDelivery(data) {
  return request({
    url: '/vendor/delivery/submit',
    method: 'post',
    data
  })
}

export function getMyConfirmations(params) {
  return request({
    url: '/vendor/delivery/myConfirmations',
    method: 'get',
    params
  })
}

export function getMyTimeliness(params) {
  return request({
    url: '/vendor/delivery/myTimeliness',
    method: 'get',
    params
  })
}

export function getMyStats() {
  return request({
    url: '/vendor/delivery/myStats',
    method: 'get'
  })
}

export function getMyMetrics() {
  return request({
    url: '/vendor/delivery/myMetrics',
    method: 'get'
  })
}

export function confirmReplyDate(params) {
  return request({
    url: '/vendor/delivery/reply-date',
    method: 'post',
    params
  })
}
