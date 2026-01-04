import { describe, it, expect } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import { Readable, Writable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { RsaAesEncryptStream, RsaAesDecryptStream } from '~/server/lib/rsa-aes'

function collectWritable() {
    const chunks: Buffer[] = []
    const w = new Writable({
        write(chunk, _enc, cb) {
            chunks.push(Buffer.from(chunk))
            cb()
        },
    })
    return {
        writable: w,
        getBuffer: () => Buffer.concat(chunks),
    }
}

describe('rsa-aes streams', () => {
    it('encrypt -> decrypt roundtrip', async () => {
        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        })

        const plain = Buffer.from('Hello RSA-AES! '.repeat(10_000), 'utf8')

        const encOut = collectWritable()
        await pipeline(
            Readable.from(plain),
            new RsaAesEncryptStream(publicKey),
            encOut.writable
        )

        const cipher = encOut.getBuffer()

        const decOut = collectWritable()
        await pipeline(
            Readable.from(cipher),
            new RsaAesDecryptStream(privateKey),
            decOut.writable
        )

        expect(decOut.getBuffer().equals(plain)).toBe(true)
    })

    it('tampering ciphertext should fail (GCM tag/auth)', async () => {
        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        })

        const plain = Buffer.from('attack at dawn', 'utf8')

        const encOut = collectWritable()
        await pipeline(
            Readable.from(plain),
            new RsaAesEncryptStream(publicKey),
            encOut.writable
        )

        const cipher = encOut.getBuffer()

        const mutated = Buffer.from(cipher)
        const idx = Math.max(0, Math.min(mutated.length - 20, 60))
        mutated[idx] = ((mutated[idx] ?? 0) ^ 0xff) & 0xff

        const decOut = collectWritable()
        await expect(
            pipeline(
                Readable.from(mutated),
                new RsaAesDecryptStream(privateKey),
                decOut.writable
            )
        ).rejects.toBeTruthy()
    })

    it('bad magic should fail early', async () => {
        const { privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        })

        const bad = Buffer.from('NOT_A_VALID_HEADER_____whatever', 'utf8')
        const decOut = collectWritable()

        await expect(
            pipeline(
                Readable.from(bad),
                new RsaAesDecryptStream(privateKey),
                decOut.writable
            )
        ).rejects.toBeTruthy()
    })
})
