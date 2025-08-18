import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  dts: true,
  external: ['react', 'react-dom', 'evtmitter'],
  esbuildOptions(options) {
    options.mangleProps = /[^_]_$/
  },
})