import request from '@/utils/request'

export const DELIVERY_COMPLETED_FILTER = {
  PENDING: false,
  COMPLETED: true,
}

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

export function getMyIncomingQuality(params) {
  return request({
    url: '/vendor/delivery/myIncomingQuality',
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

export function confirmReplyDate(data) {
  return request({
    url: '/vendor/delivery/reply-date',
    method: 'post',
    data
  })
}

export function getMyForecastList(params) {
  return request({
    url: '/vendor/orderForecast/myList',
    method: 'get',
    params
  })
}

export function getMyForecastInfo(id) {
  return request({
    url: `/vendor/orderForecast/myInfo/${id}`,
    method: 'get'
  })
}
