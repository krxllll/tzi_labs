import { mkdir, writeFile } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { generateKeyPairSync } from 'node:crypto'

export default defineEventHandler(async () => {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    })

    const dir = join(process.cwd(), 'public', 'exports')
    await mkdir(dir, { recursive: true })

    const ts = Date.now()
    const pubName = `rsa_public_${ts}.pem`
    const privName = `rsa_private_${ts}.pem`

    const pubPath = join(dir, pubName)
    const privPath = join(dir, privName)

    await writeFile(pubPath, publicKey, 'utf8')
    await writeFile(privPath, privateKey, 'utf8')

    return {
        publicKeyFile: `/exports/${basename(pubPath)}`,
        privateKeyFile: `/exports/${basename(privPath)}`,
        publicKeyName: pubName,
        privateKeyName: privName,

        publicKey,
        privateKey,
    }
})
