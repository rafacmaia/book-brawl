import { useAuth } from '@clerk/react'
import { useState } from 'react'
import { API_BASE } from '../api/client'
import { API_BASE, parseErrorDetail } from '../api/client'

import { API_BASE, parseErrorDetail } from '@/api/client'

// Keep in sync with backend api.py constant.
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

export interface ImportResult {
  imported: number
  invalid: number
  duplicates: number
  interrupted: boolean
}

export type ImportSource = 'goodreads' | 'custom'

export type ImportState =
  | { type: 'idle' }
  | { type: 'loading'; source: ImportSource }
  | { type: 'error'; message: string }
  | { type: 'success'; result: ImportResult }

export function useImportBooks() {
  const { getToken } = useAuth()

  const [state, setState] = useState<ImportState>({ type: 'idle' })

  async function importBooks(file: File, source: ImportSource, onSuccess?: () => void) {
    // Check for file size limit before triggering loading state to prevent loading flicker.
    if (file.size > MAX_FILE_SIZE) {
      setState({ type: 'error', message: 'You read too much. File size exceeds 2 MB limit.' })
      return
    }

    setState({ type: 'loading', source })

    try {
      const token = await getToken()
      const formData = new FormData()
      formData.append('file', file)
      formData.append('source', source)

      const response = await fetch(`${API_BASE}/stacks/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        const message = parseErrorDetail(err.detail) ?? 'Import failed'
        console.error('Import failed:', err)
        setState({ type: 'error', message })
        return
      }

      const result = await response.json()
      setState({ type: 'success', result })
      if (result.imported > 0) onSuccess?.()
    } catch (e) {
      console.error('Import failed:', e)
      const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
      setState({ type: 'error', message })
    }
  }

  function reset() {
    setState({ type: 'idle' })
  }

  return { importBooks, state, reset }
}
