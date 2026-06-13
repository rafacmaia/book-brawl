export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

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
    const err = await response.json().catch(() => ({}))

    if (response.status >= 500) {
      console.error('Server Error: ', response.status, err.detail)
    }

    const message = parseErrorDetail(err.detail) ?? 'Request failed'
    throw new ApiError(message, response.status)
  }

  return response
}

function parseErrorDetail(detail: unknown): string | null {
  if (typeof detail === 'string') {
    return detail
  }
  // Catches FastAPI/Pydantic error format: array of { msg, loc, type, ... }
  if (Array.isArray(detail) && detail.length > 0 && typeof detail[0]?.msg === 'string') {
    return detail[0].msg
  }

  return null
}
