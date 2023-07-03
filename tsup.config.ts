import { defineConfig } from 'tsup'
import pkg from './package.json'
import { writeFileSync } from 'fs'

export default defineConfig({
  entry: ['src/evtmitter.ts', 'src/evtmitter/react.ts'],
  clean: true,
  format: ['cjs', 'esm'],
  esbuildOptions(options) {
    options.mangleProps = /[^_]_$/
  },
})
