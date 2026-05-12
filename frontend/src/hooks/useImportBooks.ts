import { useAuth } from '@clerk/react'
import { useState } from 'react'
import { API_BASE } from '../api'

export interface ImportResult {
  imported: number
  skipped: number
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
        setState({ type: 'error', message: err.detail ?? 'Import failed' })
        return
      }

      const result = await response.json()
      setState({ type: 'success', result })
      onSuccess?.()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.'
      setState({ type: 'error', message })
    }
  }

  function reset() {
    setState({ type: 'idle' })
  }

  return { importBooks, state, reset }
}
