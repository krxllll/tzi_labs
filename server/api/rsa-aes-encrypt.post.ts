import { runMultipartFiles } from '~/server/utils/multipart'
import { createWriteStream } from 'node:fs'
import { basename, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { mkdir } from 'node:fs/promises'
import { sanitizeBaseName } from '~/server/utils/sanitizeBaseName'
import { RsaAesEncryptStream } from '~/server/lib/rsa-aes'
import { streamToString } from '~/server/utils/cryptoKey'

export default defineEventHandler(async (event) => {
    const { fileUrl, fileName } = await runMultipartFiles(event.node.req, {
        requiredFiles: ['file'],
        start: async ({ files, fields }) => {
            const file = files.file
            if (!file) throw createError({ statusCode: 400, statusMessage: 'Missing file' })

            const keyFile = files.key
            let publicKeyPem = ''

            if (keyFile) {
                publicKeyPem = await streamToString(keyFile.file)
            } else {
                publicKeyPem = (fields.publicKey ?? '').toString()
            }

            if (!publicKeyPem.trim()) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Provide public key as file (field "key") or text (field "publicKey")',
                })
            }

            const base = sanitizeBaseName(file.filename)
            const outName = `rsa_aes_enc_${Date.now()}_${base}.bin`

            const dir = join(process.cwd(), 'public', 'exports')
            await mkdir(dir, { recursive: true })
            const outPath = join(dir, outName)

            const enc = new RsaAesEncryptStream(publicKeyPem)
            await pipeline(file.file, enc, createWriteStream(outPath))

            return {
                fileUrl: `/exports/${basename(outPath)}`,
                fileName: outName,
            }
        },
    })

    return { file: fileUrl, fileName }
})
