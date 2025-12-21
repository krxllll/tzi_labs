import { runMultipartOneFile } from '~/server/utils/multipart'
import { createWriteStream } from 'node:fs'
import { join, basename } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { mkdir } from "node:fs/promises";
import { Rc5CbcPadEncryptStream } from '../lib/rc5-streams'
import { keyFromPassphrase, iv16fromLehmer, rc5KeySchedule64 } from '../lib/rc5'
import { sanitizeBaseName } from "~/server/utils/sanitizeBaseName"

export default defineEventHandler(async (event) => {
    const { fileUrl, fileName } = await runMultipartOneFile(
        event.node.req,
        {
            requiredFields: ['password'],
            start: async ({ file, filename }, fields) => {
                const password = (fields.password ?? '').trim()
                if (!password) throw createError({ statusCode: 400, statusMessage: 'Missing password' })

                const base = sanitizeBaseName(filename)
                const outName = `rc5_enc_${Date.now()}_${base}.rc5`
                const dir = join(process.cwd(), 'public', 'exports')
                await mkdir(dir, { recursive: true })
                const outPath = join(dir, outName)

                const keyBytes = keyFromPassphrase(password)
                const key = rc5KeySchedule64(keyBytes)

                const iv = iv16fromLehmer()
                const enc = new Rc5CbcPadEncryptStream(key, iv)

                await pipeline(file, enc, createWriteStream(outPath))

                return {
                    fileUrl: `/exports/${basename(outPath)}`,
                    fileName: outName,
                }
            },
        }
    )

    return { file: fileUrl, fileName }
})
