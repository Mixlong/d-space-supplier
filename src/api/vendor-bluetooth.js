import request from '@/utils/request'

export function getBluetoothFirmwareList(params) {
    return request({ url: '/vendor/bluetooth/firmware/list', method: 'get', params })
}

export function getBluetoothApplyList(params) {
    return request({ url: '/vendor/bluetooth/firmware/apply/list', method: 'get', params })
}

export function createBluetoothVersionApply(data) {
    return request({ url: '/vendor/bluetooth/firmware/apply/version', method: 'post', data })
}

export function createBluetoothFirmwareApply(data) {
    return request({ url: '/vendor/bluetooth/firmware/apply/firmware', method: 'post', data })
}

export function republishBluetoothApply(id, data = {}) {
    return request({ url: `/vendor/bluetooth/firmware/apply/${id}/publish`, method: 'put', data })
}

export function deleteBluetoothApply(id) {
    return request({ url: `/vendor/bluetooth/firmware/apply/${id}`, method: 'delete' })
}

export function getBluetoothApplyDetail(id) {
    return request({ url: `/vendor/bluetooth/firmware/apply/${id}`, method: 'get' })
}

export function getBluetoothApplyLogs(id) {
    return request({ url: `/vendor/bluetooth/firmware/apply/${id}/logs`, method: 'get' })
}
