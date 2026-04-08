import { useAuth } from '@clerk/react'
import { type ChangeEvent, useState } from 'react'
import { API_BASE, apiFetch } from '../api'

interface ImportResult {
  imported: number
  skipped: number
  interrupted: boolean
}

interface ManualResult {
  title: string
  author: string
}

function InputField({
  type,
  placeholder,
  value,
  onChange,
}: {
  type: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-md border-2 border-primary/60 bg-blue-200/75 px-4 py-2 font-gaegu text-xl font-bold text-text shadow-lg focus:bg-blue-300 ${value && 'bg-blue-300 text-primary'}`}
    />
  )
}

export function BookIntake() {
  const { getToken } = useAuth()
  const [importRes, setImportRes] = useState<ImportResult | null>(null)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [rating, setRating] = useState('')
  const [manualRes, setManualRes] = useState<ManualResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [manualError, setManualError] = useState<string | null>(null)

  async function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setImportError(null)
    setManualError(null)
    setImportRes(null)
    setManualRes(null)

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
        setImportError(err.detail ?? 'Import failed')
      }

      const data = await response.json()
      setImportRes(data)
    } catch (e: any) {
      setImportError(e.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleManualEntry() {
    setManualError(null)
    setImportError(null)
    setManualRes(null)
    setImportRes(null)

    if (!title.trim() || !author.trim()) {
      setManualError('Please enter both title and author.')
      return
    }

    const parsedRating = rating ? parseFloat(rating) : null
    if (parsedRating !== null && (parsedRating < 1 || parsedRating > 10)) {
      setManualError('Rating must be between 1 and 10.')
      return
    }

    try {
      const token = await getToken()

      const response = await apiFetch('/books', token!, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          author: author.trim(),
          rating: parsedRating,
        }),
      })

      if (response.ok) {
        setManualRes({ title: title.trim(), author: author.trim() })
        setTitle('')
        setAuthor('')
        setRating('')
      }
    } catch (e: any) {
      setManualError(e.message ?? 'Something went wrong. Please try again.')
    }
  }

  const wavyUnderline =
    'underline decoration-accent/80 decoration-wavy decoration-4 underline-offset-12'
  const subheaderStyling =
    'mb-4 text-left font-calistoga text-3xl font-bold tracking-wide underline decoration-accent/75 decoration-wavy underline-offset-8 drop-shadow-md'
  const buttonStyling =
    'mt-1 shrink-0 w-52 cursor-pointer items-center rounded-md border-2 border-accent/75 bg-primary/80 px-6 py-3 text-xl text-center font-semibold text-text shadow-lg transition-colors hover:bg-primary/95'

  return (
    <main className="flex grow flex-col items-center gap-16 p-4 text-primary/95">
      <h1
        className={`mb-4 text-center font-calistoga text-6xl font-extrabold tracking-widest drop-shadow-xs ${wavyUnderline}`}
      >
        Feed the Pit
      </h1>
      <div className={'mb-16 flex w-full grow justify-center gap-16 align-middle'}>
        {/* MANUAL ENTRY  */}
        <section className="flex w-xl flex-col gap-6 text-[22px]">
          <h2 className={subheaderStyling}>Manual Entry</h2>
          <InputField type="text" placeholder="Title" value={title} onChange={setTitle} />
          <InputField type="text" placeholder="Author" value={author} onChange={setAuthor} />
          <InputField
            type="number"
            placeholder="Optional Rating (1-10, decimals welcome)"
            value={rating}
            onChange={setRating}
          />
          <div className="mb-2 flex items-start gap-6 text-left">
            <button onClick={handleManualEntry} className={`${buttonStyling}`}>
              Add Book
            </button>
            {(manualError || manualRes) && (
              <div className="translate-y-1 self-center font-bold tracking-wide brightness-120">
                {manualError && (
                  <p className={'font-bold text-accent'}>
                    ❌<span className={'ml-2'}>{manualError}</span>
                  </p>
                )}
                {manualRes && (
                  <p className={'text-green'}>
                    ✔ Added: <span className={'ml-1 text-primary'}>{manualRes.title}</span>, by{' '}
                    <span className={'text-primary'}>{manualRes.author}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* DIVIDER */}
        <div className={'border-r-2 border-primary/60'} />

        {/* CSV IMPORT */}
        <section className="flex w-xl flex-col gap-6 text-[22px]">
          <h2 className={subheaderStyling}>Import from CSV</h2>
          <div className="flex flex-col gap-3 text-left">
            <p>
              Your CSV must have{' '}
              <span className={'font-bold underline decoration-accent/75'}>title</span> and{' '}
              <span className={'font-bold underline decoration-accent/75'}>author</span> columns.
            </p>
            <p>
              A <span className={'font-bold underline decoration-accent/75'}>rating</span> column
              (1-10, decimals welcome) is encouraged, but optional.
            </p>
          </div>
          <label
            className={`${buttonStyling} disabled:cursor-not-allowed disabled:bg-primary/70 disabled:text-primary/50`}
          >
            Select CSV File
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
            />
          </label>
          {loading && <p className={'font-bold'}>Importing...</p>}
          {importError && <p className="font-bold text-accent">{importError}</p>}
          {importRes && (
            <div className="flex flex-col gap-2 text-left font-semibold tracking-wide brightness-110">
              {importRes.skipped > 0 && (
                <p className={'mt-1'}>
                  Skipped{' '}
                  <span className={'underline decoration-accent/70'}>{importRes.skipped}</span>{' '}
                  {importRes.skipped > 1 ? 'books' : 'book'} already in the system.
                </p>
              )}
              {importRes.imported > 0 ? (
                <p className={'text-green'}>
                  ✔ Imported{' '}
                  <span className={'font-extrabold text-primary'}>{importRes.imported}</span>{' '}
                  {importRes.imported > 1 ? 'books' : 'book'}!
                </p>
              ) : (
                <p>
                  ❌{' '}
                  <span className={'underline decoration-accent/70'}>
                    No books imported. Check file and try again.
                  </span>
                </p>
              )}
              {importRes.interrupted && (
                <p className="font-bold text-accent">
                  'Book limit reached, not all books were imported!'
                </p>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
