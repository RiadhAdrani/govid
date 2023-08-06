import { defineConfig } from 'vite';
import UnoCSS from 'unocss/vite';
import path from 'path';

export default defineConfig({
  plugins: [UnoCSS({ configFile: path.resolve(__dirname, './unocss.config.ts') })],
  server: {
    port: 3000,
  },
});
