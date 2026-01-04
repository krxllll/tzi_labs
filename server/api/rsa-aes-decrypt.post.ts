import { runMultipartFiles } from '~/server/utils/multipart'
import { createWriteStream } from 'node:fs'
import { basename, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { mkdir } from 'node:fs/promises'
import { sanitizeBaseName } from '~/server/utils/sanitizeBaseName'
import { RsaAesDecryptStream } from '~/server/lib/rsa-aes'

export default defineEventHandler(async (event) => {
    const { fileUrl, fileName } = await runMultipartFiles(event.node.req, {
        requiredFiles: ['file', 'key'],
        start: async ({ files }) => {
            const file = files.file
            const keyFile = files.key

            if (!file) throw createError({ statusCode: 400, statusMessage: 'Missing file' })
            if (!keyFile) throw createError({ statusCode: 400, statusMessage: 'Missing key file' })

            const privateKeyPem = await streamToString(keyFile.file)
            if (!privateKeyPem.trim()) throw createError({ statusCode: 400, statusMessage: 'Empty private key file' })

            const encBase = sanitizeBaseName(file.filename)

            let originalBase = encBase.endsWith('.bin')
                ? encBase.slice(0, -4)
                : encBase

            originalBase = originalBase.replace(/^rsa_aes_enc_\d+_/, '') || originalBase

            const finalBase = originalBase.includes('.')
                ? originalBase
                : `${originalBase}.txt`

            const outName = `rsa_aes_dec_${Date.now()}_${finalBase}`

            const dir = join(process.cwd(), 'public', 'exports')
            await mkdir(dir, { recursive: true })
            const outPath = join(dir, outName)

            const dec = new RsaAesDecryptStream(privateKeyPem)
            await pipeline(file.file, dec, createWriteStream(outPath))

            return {
                fileUrl: `/exports/${basename(outPath)}`,
                fileName: outName,
            }
        },
    })

    return { file: fileUrl, fileName }
})

function streamToString(s: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = []
        s.on('data', (c) => chunks.push(Buffer.from(c)))
        s.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
        s.on('error', reject)
    })
}
