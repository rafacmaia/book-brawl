export function Placeholder({ message }: { message: string }) {
  const loading = /loading/i.test(message)

  return (
    <div className={'flex grow items-center justify-center'}>
      <h1
        className={`w-2xl text-center text-5xl/20 font-extrabold tracking-wide text-primary/85 ${loading ? 'animate-pulse font-gaegu' : 'animate-bounce font-zain'}`}
      >
        {message}
      </h1>
    </div>
  )
}
