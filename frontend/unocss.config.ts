// uno.config.ts
import {
  defineConfig,
  presetUno,
  presetWebFonts,
  presetIcons,
  presetWind,
  presetMini,
} from 'unocss';

export default defineConfig({
  presets: [
    presetWebFonts({
      provider: 'google',
      fonts: {
        sans: 'Roboto',
      },
    }),
    presetIcons(),
    presetWind(),
    presetUno(),
  ],
  shortcuts: [
    {
      col: 'flex flex-col',
      row: 'flex flex-row',

      'col-center': 'col justify-center items-center',
      'row-center': 'row justify-center items-center',

      'col-reverse': 'flex flex-col-reverse',
      'row-reverse': 'flex flex-row-reverse',

      'action-btn':
        'row-center gap-2 p-x-5 p-y-2 cursor-pointer rounded-20px text-md hover:bg-zinc-700',

      'player-btn': 'cursor-pointer rounded-50% row-center hover:bg-zinc-800 aspect-square p-1',
      'player-btn-page': 'player-btn text-1.25em',
      'player-btn-mini': 'player-btn text-1em',

      'icon-btn':
        'col-center bg-zinc-900 rounded-50% aspect-square hover:bg-zinc-800 active:bg-zinc-700',
    },
  ],
});
