import { useAuth } from '@clerk/react'
import { useState } from 'react'

import { API_BASE, DEFAULT_ERROR_MESSAGE, parseErrorDetail } from '@/api/client'
import type { FileSource, ImportOutcome } from '@/api/types'

// Keep in sync with backend api.py constant.
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2 MB

const FILE_TOO_LARGE_MESSAGE = 'You read too much! File size exceeds 2 MB limit.'

export type ImportState =
  | { type: 'idle' }
  | { type: 'loading'; source: FileSource }
  | { type: 'error'; message: string }
  | { type: 'success'; result: ImportOutcome }

export function useImportBooks() {
  const { getToken } = useAuth()

  const [state, setState] = useState<ImportState>({ type: 'idle' })

  async function importBooks(file: File, source: FileSource, onSuccess?: () => void) {
    // Check for file size limit before triggering loading state to prevent loading flicker.
    if (file.size > MAX_FILE_SIZE) {
      setState({ type: 'error', message: FILE_TOO_LARGE_MESSAGE })
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

        if (response.status === 413) {
          setState({ type: 'error', message: FILE_TOO_LARGE_MESSAGE })
          return
        }

        const message = parseErrorDetail(err.detail) ?? 'Import failed'
        setState({ type: 'error', message })
        return
      }

      const result: ImportOutcome = await response.json()
      setState({ type: 'success', result })
      if (result.imported > 0) onSuccess?.()
    } catch (e) {
      console.error('Import failed:', e)
      const message = e instanceof Error ? e.message : DEFAULT_ERROR_MESSAGE
      setState({ type: 'error', message })
    }
  }

  function reset() {
    setState({ type: 'idle' })
  }

  return { importBooks, state, reset }
}
