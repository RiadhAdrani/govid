import { defineConfig } from 'vite';
import UnoCSS from 'unocss/vite';

export default defineConfig({
  plugins: [UnoCSS()],
  server: {
    port: 3000,
  },
});
