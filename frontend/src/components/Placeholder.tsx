export default function Placeholder({ message }: { message: string }) {
  const loading = /loading/i.test(message)

  return (
    <div className={'flex w-full grow items-center justify-center'}>
      <p
        className={`max-w-3xl text-center text-5xl/20 font-extrabold tracking-wide text-primary/85 ${loading ? 'animate-pulse font-gaegu' : 'animate-bounce font-zain'}`}
      >
        {message}
      </p>
    </div>
  )
}
