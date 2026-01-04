import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/unit/**/*.spec.ts'],
    },
    resolve: {
        alias: {
            '~': root,
            '@': root,
        },
    },
})
