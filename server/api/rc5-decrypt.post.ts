import { runMultipartOneFile } from '~/server/utils/multipart'
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { Rc5CbcPadDecryptStream } from '../lib/rc5-streams'
import { keyFromPassphrase, rc5KeySchedule64 } from '../lib/rc5'
import { sanitizeBaseName } from '~/server/utils/sanitizeBaseName'

export default defineEventHandler(async (event) => {
    const dir = join(process.cwd(), 'public', 'exports')
    await mkdir(dir, { recursive: true })
    const { fileUrl, fileName } = await runMultipartOneFile(event.node.req, {
        requiredFields: ['password'],
        start: async ({ file, filename }, fields) => {
            const password = (fields.password ?? '').trim()
            if (!password) throw createError({ statusCode: 400, statusMessage: 'Missing password' })

            const encBase = sanitizeBaseName(filename)
            const originalBase = encBase.replace(/^rc5_enc_\d+_/, '') || encBase

            const finalBase = originalBase.includes('.') ? originalBase : `${originalBase}.txt`

            const outName = `rc5_dec_${Date.now()}_${finalBase}`
            const outPath = join(dir, outName)

            const keyBytes = keyFromPassphrase(password)
            const key = rc5KeySchedule64(keyBytes)

            const dec = new Rc5CbcPadDecryptStream(key)
            await pipeline(file, dec, createWriteStream(outPath))

            return {
                fileUrl: `/exports/${basename(outPath)}`,
                fileName: outName,
            }
        },
    })

    return { file: fileUrl, fileName }
})
