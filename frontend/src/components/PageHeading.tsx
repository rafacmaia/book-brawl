export function PageHeading({ title }: { title: string }) {
  const wavyUnderline =
    'underline decoration-accent/80 decoration-wavy decoration-4 underline-offset-12'

  return (
    <h1
      className={`text-center font-calistoga text-6xl font-extrabold tracking-widest text-primary/95 drop-shadow-xs ${wavyUnderline}`}
    >
      {title}
    </h1>
  )
}
