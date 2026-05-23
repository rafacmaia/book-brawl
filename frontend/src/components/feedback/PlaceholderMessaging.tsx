export default function PlaceholderMessaging({ message }: { message: string }) {
  const loading = /loading/i.test(message)

  return (
    <div className={'flex w-full grow items-center justify-center'}>
      <p
        className={`max-w-3xl animate-pulse text-center text-4xl/17 font-extrabold tracking-wide text-balance text-primary/85 max-md:px-4 md:text-5xl/20 ${loading ? 'font-gaegu text-5xl/20' : 'font-zain text-4xl/19'}`}
      >
        {message}
      </p>
    </div>
  )
}
