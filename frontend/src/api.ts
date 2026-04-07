export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function apiFetch(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail ?? `Request failed: ${response.status}`)
  }

  return response
}
