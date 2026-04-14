export default function Footer() {
  return (
    <footer className="mt-auto flex w-screen flex-col items-center gap-4 p-4 text-center text-footer/75">
      <div className="h-px w-7/8 bg-footer opacity-50 sm:w-1/3" />
      <small className="block font-gaegu text-[17px]">
        © 2026{' '}
        <a
          className="cursor-pointer font-bold underline decoration-footer/40 decoration-1 underline-offset-2 transition-all duration-200 hover:text-footer hover:brightness-125 active:text-footer active:brightness-125 sm:animate-none sm:no-underline"
          href="https://github.com/rafacmaia"
          target="_blank"
          rel="noopener noreferrer"
        >
          Zou Labs
          <img
            src={'/cat-icon-1.svg'}
            alt={'cat icon'}
            className={'inline h-6 w-6 brightness-110'}
          />
        </a>
        . Some rights reserved.
      </small>
    </footer>
  )
}
