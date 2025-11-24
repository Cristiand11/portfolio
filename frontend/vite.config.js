import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      all: true,
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/main.jsx',
        'src/vite-env.d.ts',
        'src/setupTests.js',
        '**/*.test.{js,jsx}',
        'postcss.config.js',
        'tailwind.config.js',
        '.eslintrc.cjs',
        'dist/**'
      ]
    }
  },
})