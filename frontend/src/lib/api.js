const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:5050'

function getAuthToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem('boda_credit_auth_token') || ''
}

async function request(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  const authToken = getAuthToken()
  if (authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${authToken}`
  }

  const hasJsonBody =
    options.body !== undefined &&
    options.body !== null &&
    !(options.body instanceof FormData)

  if (hasJsonBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message = payload?.message || 'Request failed'
    throw new Error(message)
  }

  return payload
}

export { API_BASE_URL, request }
