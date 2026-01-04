import { describe, it, expect } from 'vitest'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readPemFromStringOrFile } from '~/server/utils/readPem'

describe('readPemFromStringOrFile', () => {
    it('returns PEM string as-is (ignoring trailing newline)', async () => {
        const pem = `-----BEGIN PUBLIC KEY-----\nABC\n-----END PUBLIC KEY-----\n`
        const out = await readPemFromStringOrFile(pem)
        expect(out.trimEnd()).toBe(pem.trimEnd())
    })

    it('reads PEM from file path', async () => {
        const dir = await mkdtemp(join(tmpdir(), 'pem-test-'))
        const p = join(dir, 'k.pem')
        const pem = `-----BEGIN PRIVATE KEY-----\nXYZ\n-----END PRIVATE KEY-----\n`
        await writeFile(p, pem, 'utf8')

        const out = await readPemFromStringOrFile(p)
        expect(out.trimEnd()).toBe(pem.trimEnd())
    })

    it('throws on empty', async () => {
        await expect(readPemFromStringOrFile('   ')).rejects.toBeTruthy()
    })
})
