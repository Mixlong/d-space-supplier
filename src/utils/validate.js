export function isHttp(path = '') {
  return /^https?:\/\//.test(path)
}

export function isExternal(path = '') {
  return /^(https?:|mailto:|tel:)/.test(path)
}

export function isEmpty(value) {
  return value === undefined || value === null || value === ''
}
