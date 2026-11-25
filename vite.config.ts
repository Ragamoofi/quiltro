import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Rebuilds the sprite sheet (public/assets/sprites.png + .json) from the pixel
 * matrices in src/art/ when the dev server starts and whenever an art file changes.
 * Runs in a child process so the matrices are always re-read fresh.
 */
function spriteSheet(): Plugin {
  const build = (): void => {
    execFileSync(process.execPath, ['scripts/build-sprites.ts'], { stdio: 'inherit' });
  };
  return {
    name: 'quiltro-sprites',
    buildStart() {
      build();
    },
    handleHotUpdate({ file, server }) {
      const path = file.replace(/\\/g, '/');
      // Art drawn in code and hand-retouched PNGs (sprites-retocados/) both rebuild the sheet.
      if (path.includes('/src/art/') || path.includes('/sprites-retocados/')) {
        try {
          build();
          server.ws.send({ type: 'full-reload' });
        } catch {
          // The error is already printed by the child process.
        }
        return [];
      }
      return undefined;
    },
  };
}

export default defineConfig({
  // Relative base so the same build works on GitHub Pages (/<repo>/) and locally.
  base: './',
  plugins: [
    spriteSheet(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['assets/icon.png', 'assets/apple-touch-icon.png'],
      manifest: {
        name: 'QUILTRO',
        short_name: 'QUILTRO',
        description: 'Un quiltro, un viaje de Arica a Punta Arenas y un montón de bichos.',
        lang: 'es-CL',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        theme_color: '#2A2233',
        background_color: '#2A2233',
        icons: [
          { src: 'assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,json,webmanifest}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/sprites\.html$/],
      },
    }),
  ],
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        sprites: resolve(import.meta.dirname, 'sprites.html'),
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
