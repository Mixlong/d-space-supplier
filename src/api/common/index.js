import request from '@/api/common'

export async function uploadFile(file, config = {}) {
  const formData = new FormData()
  formData.append('file', file)

  return request({
    url: '/oss/batch-upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...config.headers
    },
    ...config
  })
}

export async function uploadFiles(files, config = {}) {
  const formData = new FormData()
  Array.from(files).forEach(file => {
    formData.append('file', file)
  })

  return request({
    url: '/oss/batch-upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...config.headers
    },
    ...config
  })
}
