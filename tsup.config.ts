import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  external: [
    '@polkadot/api',
    '@polkadot/extension-dapp',
    '@polkadot/util',
    '@polkadot/util-crypto',
    '@polkadot/keyring'
  ]
})
