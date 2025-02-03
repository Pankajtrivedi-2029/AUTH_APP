// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

// export default {
//   build: {
//     sourcemap: false, // Disable sourcemaps
//     minify: 'esbuild', // Use esbuild for minification (it doesn't require eval)
//     target: 'esnext', // Ensure compatibility with modern browsers
//     esbuild: {
//       legalComments: 'none', // Remove any comments in the minified code
//     },
//   },
// };

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false, // Disable sourcemaps
    minify: 'esbuild', // Use esbuild for minification (it doesn't require eval)
    target: 'esnext', // Ensure compatibility with modern browsers
    esbuild: {
      legalComments: 'none', // Remove any comments in the minified code
    },
  },
});
