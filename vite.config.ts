import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

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
      if (file.replace(/\\/g, '/').includes('/src/art/')) {
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
  plugins: [spriteSheet()],
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
