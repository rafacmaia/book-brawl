import catIcon from '@/assets/cat-icon-1.svg'

export default function Footer() {
  return (
    <footer className="mt-auto flex w-full flex-col items-center gap-2.75 px-4 pt-3 pb-2 text-center text-footer/75 [@media(max-height:500px)]:hidden [@media(min-height:700px)]:gap-3.75 [@media(min-height:700px)]:py-3 [@media(min-height:700px)]:sm:py-4">
      <div className="h-px w-[97%] bg-footer opacity-50 sm:w-2/5" />
      <small className="block font-gaegu text-xs [@media(min-height:700px)]:text-sm [@media(min-height:700px)]:sm:text-base">
        © 2026{' '}
        <a
          className="cursor-pointer font-bold underline decoration-footer/40 decoration-dotted decoration-1 underline-offset-3 transition-all duration-200 hover:text-footer hover:brightness-125 active:text-footer active:brightness-125 sm:animate-none sm:no-underline"
          href="https://github.com/rafacmaia"
          target="_blank"
          rel="noopener noreferrer"
        >
          Zou Labs
          <img
            src={catIcon}
            alt={'cat icon'}
            className={
              'inline size-5 brightness-110 [@media(min-height:700px)]:size-5.5 [@media(min-height:700px)]:sm:size-6'
            }
          />
        </a>
        <span className={'mr-2 ml-0.5 align-middle sm:mr-2.25 sm:ml-0.75'}>•</span>
        <a
          href="https://github.com/rafacmaia/book-brawl/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
        >
          MIT License
        </a>
      </small>
    </footer>
  )
}
