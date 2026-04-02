export function Placeholder({ message }: { message: string }) {
  return (
    <div className={'flex grow items-center justify-center'}>
      <h1
        className={
          'font-gaegu text-5xl font-bold tracking-wide text-primary/90'
        }
      >
        {message}
      </h1>
    </div>
  )
}
