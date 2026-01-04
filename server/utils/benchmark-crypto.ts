import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { performance } from 'node:perf_hooks'
import { randomBytes } from 'node:crypto'
import { Readable } from 'node:stream'

import { Rc5CbcPadEncryptStream } from '../lib/rc5-streams'
import { keyFromPassphrase, iv16fromLehmer, rc5KeySchedule64 } from '../lib/rc5'
import { RsaAesEncryptStream } from '../lib/rsa-aes'
import { generateKeyPairSync } from 'node:crypto'

const TMP = join(process.cwd(), 'tmp-benchmark')

async function createTestFile(sizeMB: number): Promise<string> {
    const path = join(TMP, `test_${sizeMB}mb.bin`)
    const size = sizeMB * 1024 * 1024
    await mkdir(TMP, { recursive: true })

    const buffer = randomBytes(size)

    await pipeline(
        Readable.from(buffer),
        createWriteStream(path)
    )

    return path
}

async function benchmarkRC5(filePath: string) {
    const key = rc5KeySchedule64(keyFromPassphrase('benchmark-password'))
    const iv = iv16fromLehmer(123)

    const out = filePath + '.rc5'

    const start = performance.now()
    await pipeline(
        createReadStream(filePath),
        new Rc5CbcPadEncryptStream(key, iv),
        createWriteStream(out)
    )
    const end = performance.now()

    return end - start
}

async function benchmarkRsaAes(filePath: string) {
    const { publicKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })

    const out = filePath + '.rsa'

    const start = performance.now()
    await pipeline(
        createReadStream(filePath),
        new RsaAesEncryptStream(publicKey),
        createWriteStream(out)
    )
    const end = performance.now()

    return end - start
}

async function run() {
    const sizes = [1, 5, 10]

    console.log('=== Crypto benchmark (RC5 vs RSA-AES) ===')

    for (const size of sizes) {
        const file = await createTestFile(size)

        const rc5Time = await benchmarkRC5(file)
        const rsaAesTime = await benchmarkRsaAes(file)

        console.log(
            `${size} MB | RC5: ${rc5Time.toFixed(2)} ms | RSA-AES: ${rsaAesTime.toFixed(2)} ms`
        )
    }
}

run().catch(console.error)
