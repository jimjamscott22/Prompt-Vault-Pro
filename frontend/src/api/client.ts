const BASE_URL = '/api/v1'

interface ApiResponse<T> {
  data: T
  meta?: {
    page: number
    per_page: number
    total: number
  }
}

interface ApiError {
  error: {
    code: string
    message: string
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const err: ApiError = await res.json()
    throw new Error(err.error?.message ?? `Request failed: ${res.status}`)
  }

  if (res.status === 204) {
    return { data: undefined as T }
  }

  return res.json()
}

export function get<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return request<T>(`${path}${query}`)
}

export function post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function put<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function del(path: string): Promise<ApiResponse<void>> {
  return request<void>(path, { method: 'DELETE' })
}
