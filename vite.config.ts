/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/Hemodynamics-calculator-/',
  plugins: [react()],
  test: {
    globals: false,
    environment: 'node',
  },
});
