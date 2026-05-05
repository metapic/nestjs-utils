import metapic from '@metapic/eslint-config'
import { defineConfig } from 'eslint/config'
import globals from 'globals'

export default defineConfig({
  extends: [metapic.configs.recommended],
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
    },
    globals: {
      ...globals.node,
    },
  },
})
