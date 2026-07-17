const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:5050'

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504])
const RETRYABLE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const DEFAULT_RETRY_DELAYS_MS = [800, 1800, 3500]

function getAuthToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem('boda_credit_auth_token') || ''
}

function delay(ms) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

function isRetryableRequest(options) {
  const method = (options.method || 'GET').toUpperCase()
  return options.retry !== false && RETRYABLE_METHODS.has(method)
}

function getRetryDelays(options) {
  if (!isRetryableRequest(options)) {
    return []
  }

  if (Array.isArray(options.retryDelays)) {
    return options.retryDelays
  }

  return DEFAULT_RETRY_DELAYS_MS
}

async function parseResponsePayload(response) {
  return response.json().catch(() => null)
}

async function request(path, options = {}) {
  const { retry, retryDelays, ...fetchOptions } = options
  const headers = {
    Accept: 'application/json',
    ...fetchOptions.headers,
  }

  const authToken = getAuthToken()
  if (authToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${authToken}`
  }

  const hasJsonBody =
    fetchOptions.body !== undefined &&
    fetchOptions.body !== null &&
    !(fetchOptions.body instanceof FormData)

  if (hasJsonBody && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const retryOptions = { ...fetchOptions, retry, retryDelays }
  const retryDelaysMs = getRetryDelays(retryOptions)
  let lastError = null

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...fetchOptions,
        headers,
      })

      const payload = await parseResponsePayload(response)

      if (response.ok) {
        return payload
      }

      const message = payload?.message || 'Request failed'
      const error = new Error(message)
      error.status = response.status

      if (!RETRYABLE_STATUS_CODES.has(response.status) || attempt === retryDelaysMs.length) {
        throw error
      }

      lastError = error
    } catch (error) {
      lastError = error

      if (error.status && !RETRYABLE_STATUS_CODES.has(error.status)) {
        throw error
      }

      if (attempt === retryDelaysMs.length) {
        throw error
      }
    }

    await delay(retryDelaysMs[attempt])
  }

  throw lastError || new Error('Request failed')
}

export { API_BASE_URL, request }
