import { store } from '@/store'

export type LoginRequest = { email: string; password: string }
export type LoginResponse = { token: string }
export type SignupRequest = LoginRequest
export type SignupResponse = LoginResponse
export type SearchRequest = { q: string; p?: number }
export type SearchResponse = Array<{
  channelId: string
  duration: string
  from: string
  lang: string
  text: string
  videoId: string
  videoTitle: string
  cursor: number
}>

export type BackendRequests = {
  '/api/auth/signup': [SignupRequest, SignupResponse]
  '/api/auth/login': [LoginRequest, LoginResponse]
  '/api/v1/search': [SearchRequest, SearchResponse]
}

const METHODS: Record<keyof BackendRequests, 'GET' | 'POST'> = {
  '/api/auth/signup': 'POST',
  '/api/auth/login': 'POST',
  '/api/v1/search': 'GET',
} as const

export type BackendRawResponse =
  | { result: 'success'; data: BackendRequests[keyof BackendRequests][1] }
  | { result: 'error'; error: unknown }

export function request<T extends keyof BackendRequests>(
  endpoint: T,
  body: BackendRequests[T][0],
): Promise<BackendRequests[T][1]> {
  const headers: HeadersInit = {}

  if (store.auth.authenticated) {
    headers['Authorization'] = `Bearer ${store.auth.token}`
  }

  if (METHODS[endpoint] === 'POST') {
    headers['Content-Type'] = 'application/json'
  }

  let serializedBody: string | undefined = undefined
  if (METHODS[endpoint] === 'POST') {
    serializedBody = JSON.stringify(body)
  }
  let queryString = ''
  if (METHODS[endpoint] === 'GET' && Object.keys(body).length > 0) {
    queryString = '?' + new URLSearchParams(body as Record<string, string>).toString()
  }

  return fetch(`${import.meta.env.VITE_BACKEND_URL}${endpoint}${queryString}`, {
    method: METHODS[endpoint],
    headers,
    body: serializedBody,
  })
    .then((res) => res.json() as Promise<BackendRawResponse>)
    .then((res) => {
      if (res.result === 'success') {
        return res.data
      }
      throw new Error(res.error?.toString() ?? 'Unknown error')
    })
}
