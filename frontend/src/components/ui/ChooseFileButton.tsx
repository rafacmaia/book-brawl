export function ChooseFileButton({
  isLoading,
  onFileSelect,
  className,
}: {
  isLoading: boolean
  onFileSelect: (file: File) => void
  className?: string
}) {
  return (
    <label className={className}>
      {isLoading ? 'Importing...' : 'Choose File'}
      <input
        type="file"
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileSelect(file)
          // Reset so the same file can be re-selected (file inputs don't fire OnChange
          // when the same file is selected twice)
          e.target.value = ''
        }}
        disabled={isLoading}
        className="sr-only"
      />
    </label>
  )
}
