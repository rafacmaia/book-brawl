export default function Footer() {
  return (
    <footer className="text-text/60 flex w-screen flex-col items-center gap-3 p-4 text-center text-primary/75">
      <hr className="w-1/3 border-primary opacity-30" />
      <small className="block font-gaegu text-xs">
        © 2026{' '}
        <a
          className="cursor-pointer font-bold hover:text-primary/100 hover:brightness-115 active:text-primary/100"
          href="https://github.com/rafacmaia"
          target="_blank"
          rel="noopener"
        >
          Zou Labs
          <img
            src={'cat-icon-1.svg'}
            alt={'cat icon'}
            className={'inline h-5 w-5 brightness-110'}
          />
        </a>
        . Some rights reserved.
      </small>
    </footer>
  )
}
