// uno.config.ts
import { defineConfig, presetUno, presetWebFonts, presetIcons } from 'unocss';

//  const join = (array: Array<string>): string => `@apply ${array.join(' ')}`;

export default defineConfig({
  presets: [
    presetWebFonts({
      provider: 'google',
      fonts: {
        sans: 'Roboto',
      },
    }),
    presetIcons(),
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

      'icon-btn':
        'col-center bg-zinc-900 rounded-50% aspect-square hover:bg-zinc-800 active:bg-zinc-700',
    },
  ],
});
