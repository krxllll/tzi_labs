import { runMultipartFiles } from '~/server/utils/multipart'
import { createWriteStream } from 'node:fs'
import { basename, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { mkdir } from 'node:fs/promises'
import { sanitizeBaseName } from '~/server/utils/sanitizeBaseName'
import { RsaAesDecryptStream } from '~/server/lib/rsa-aes'
import { streamToString } from '~/server/utils/cryptoKey'

export default defineEventHandler(async (event) => {
    const { fileUrl, fileName } = await runMultipartFiles(event.node.req, {
        requiredFiles: ['file'],
        start: async ({ files, fields }) => {
            const file = files.file
            if (!file) throw createError({ statusCode: 400, statusMessage: 'Missing file' })

            const keyFile = files.key
            let privateKeyPem = ''

            if (keyFile) {
                privateKeyPem = await streamToString(keyFile.file)
            } else {
                privateKeyPem = (fields.privateKey ?? '').toString()
            }

            if (!privateKeyPem.trim()) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Provide private key as file (field "key") or text (field "privateKey")',
                })
            }

            const encBase = sanitizeBaseName(file.filename)

            let originalBase = encBase.endsWith('.bin') ? encBase.slice(0, -4) : encBase
            originalBase = originalBase.replace(/^rsa_aes_enc_\d+_/, '') || originalBase

            const finalBase = originalBase.includes('.') ? originalBase : `${originalBase}.txt`

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
