import { describe, it, expect } from 'vitest'
import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'

describe('rsa-generate-keys endpoint', () => {
    it('generates keypair and writes pem files', async () => {
        ;(globalThis as any).defineEventHandler = (fn: any) => fn

        const mod = await import('~/server/api/rsa-generate-keys.post')
        const handler = mod.default as any

        const res: any = await handler({} as any)

        expect(res.publicKeyFile).toMatch(/^\/exports\/.+\.pem$/)
        expect(res.privateKeyFile).toMatch(/^\/exports\/.+\.pem$/)
        expect(res.publicKey).toMatch(/BEGIN PUBLIC KEY/)
        expect(res.privateKey).toMatch(/BEGIN PRIVATE KEY/)

        const pubFsPath = join(process.cwd(), 'public', res.publicKeyFile)
        const privFsPath = join(process.cwd(), 'public', res.privateKeyFile)

        await access(pubFsPath)
        await access(privFsPath)

        const pubText = await readFile(pubFsPath, 'utf8')
        const privText = await readFile(privFsPath, 'utf8')
        expect(pubText).toMatch(/BEGIN PUBLIC KEY/)
        expect(privText).toMatch(/BEGIN PRIVATE KEY/)
    })
})
