export default function Footer() {
  return (
    <footer className="mt-auto flex w-screen flex-col items-center gap-4 px-4 pt-4 pb-3 text-center text-footer/75 sm:pb-4">
      <div className="h-px w-[97%] bg-footer opacity-50 sm:w-1/3" />
      <small className="block font-gaegu text-[16px] sm:text-[17px]">
        © 2026{' '}
        <a
          className="cursor-pointer font-bold underline decoration-footer/40 decoration-dotted decoration-1 underline-offset-3 transition-all duration-200 hover:text-footer hover:brightness-125 active:text-footer active:brightness-125 sm:animate-none sm:no-underline"
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
