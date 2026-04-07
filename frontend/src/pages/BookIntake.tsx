import { useAuth } from '@clerk/react'
import { type ChangeEvent, useState } from 'react'
import { API_BASE } from '../api'

interface ImportResult {
  imported: number
  skipped: number
  interrupted: boolean
}

export function BookIntake() {
  const { getToken } = useAuth()
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const token = await getToken()
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`${API_BASE}/books/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        setError(err.detail ?? 'Import failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const wavyUnderline =
    'underline decoration-accent/80 decoration-wavy decoration-4 underline-offset-12'

  return (
    <main className="flex grow flex-col items-center gap-8 p-4 text-primary/95">
      <h1
        className={`text-center font-calistoga text-6xl font-extrabold tracking-widest drop-shadow-xs ${wavyUnderline}`}
      >
        Feed the Pit
      </h1>
      {/* CSV IMPORT */}
      <section className="mt-8 flex w-1/2 flex-col gap-8 text-xl">
        <h2 className="text-left font-calistoga text-3xl font-bold tracking-wide text-primary/95 drop-shadow-md">
          Import from CSV
        </h2>
        <p>
          Your CSV must have{' '}
          <span className={'font-bold underline decoration-accent/75'}>title</span> and{' '}
          <span className={'font-bold underline decoration-accent/75'}>author</span> columns. A{' '}
          <span className={'font-bold underline decoration-accent/75'}>rating</span> column (1-10,
          decimals welcome) is encouraged, but optional.
        </p>
        <label className="mt-2 cursor-pointer items-center self-center rounded-md border-2 border-accent/80 bg-primary/90 px-12 py-3 text-center font-semibold text-text shadow-lg transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:bg-primary/70 disabled:text-primary/50">
          Select CSV File
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={loading}
            className="hidden"
          />
        </label>

        {loading && <p>Importing...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {result && (
          <>
            <p>✔ Imported {result.imported} books!</p>
            <p>{result.skipped > 0 && `Skipped ${result.skipped} books already in the system`}</p>
            <p>{result.interrupted && 'Book limit reached, not all books were imported!'}</p>
          </>
        )}
      </section>
    </main>
  )
}
