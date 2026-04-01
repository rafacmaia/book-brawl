export default function Footer() {
  return (
    <footer className="text-text/60 mt-auto flex w-screen flex-col items-center gap-3 p-4 text-center text-primary/75">
      <hr className="w-1/3 border-primary opacity-30" />
      <small className="block font-gaegu text-base">
        © 2026{' '}
        <a
          className="cursor-pointer font-bold hover:text-primary hover:brightness-125"
          href="https://github.com/rafacmaia"
          target="_blank"
          rel="noopener"
        >
          Zou Labs
          <img
            src={'cat-icon-1.svg'}
            alt={'cat icon'}
            className={'inline h-6 w-6 brightness-110'}
          />
        </a>
        . Some rights reserved.
      </small>
    </footer>
  )
}
