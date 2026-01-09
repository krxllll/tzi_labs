import { mkdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { generateDssKeys } from '~/server/lib/dss'

export default defineEventHandler(async () => {
    const { publicKeyPem, privateKeyPem } = generateDssKeys()

    const dir = join(process.cwd(), 'public', 'exports')
    await mkdir(dir, { recursive: true })

    const ts = Date.now()
    const pubName = `dss_public_${ts}.pem`
    const privName = `dss_private_${ts}.pem`

    const pubPath = join(dir, pubName)
    const privPath = join(dir, privName)

    await writeFile(pubPath, publicKeyPem, 'utf8')
    await writeFile(privPath, privateKeyPem, 'utf8')

    return {
        publicKeyFile: `/exports/${basename(pubPath)}`,
        publicKeyFileName: pubName,
        privateKeyFile: `/exports/${basename(privPath)}`,
        privateKeyFileName: privName,

        publicKey: publicKeyPem,
        privateKey: privateKeyPem,
    }
})
