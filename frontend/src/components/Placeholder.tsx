export default function Placeholder({ message }: { message: string }) {
  const loading = /loading/i.test(message)

  return (
    <div className={'flex w-full grow items-center justify-center'}>
      <p
        className={`max-w-3xl animate-pulse text-center text-5xl/20 font-extrabold tracking-wide text-primary/85 ${loading ? 'font-gaegu' : 'font-zain'}`}
      >
        {message}
      </p>
    </div>
  )
}
