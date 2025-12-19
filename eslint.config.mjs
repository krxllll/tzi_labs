// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'

export default withNuxt().append({
    files: ['**/*.vue'],
    languageOptions: {
        parser: vueParser,
        parserOptions: {
            parser: tsParser,
            extraFileExtensions: ['.vue'],
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
    },
    rules: {
        'no-undef': 'off',
        'vue/multi-word-component-names': 'off',
    },
})
