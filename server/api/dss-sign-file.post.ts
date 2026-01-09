import { runMultipartFiles } from '~/server/utils/multipart'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { sanitizeBaseName } from '~/server/utils/sanitizeBaseName'
import { signStreamDssSha1, toHex } from '~/server/lib/dss'
import { readKeyFromMultipart } from '~/server/utils/cryptoKey'

export default defineEventHandler(async (event) => {
    return await runMultipartFiles(event.node.req, {
        requiredFiles: ['file'],
        start: async ({ files, fields }) => {
            const file = files.file
            if (!file) throw createError({ statusCode: 400, statusMessage: 'Missing file' })

            const { pem: privateKeyPem } = await readKeyFromMultipart(files as any, fields, 'privateKey')

            const dir = join(process.cwd(), 'public', 'exports')
            await mkdir(dir, { recursive: true })

            const base = sanitizeBaseName(file.filename || 'file')
            const outName = `dss_file_sig_${Date.now()}_${base}.sig`
            const outPath = join(dir, outName)

            const { signatureDer, sizeBytes } = await signStreamDssSha1(file.file, privateKeyPem)
            const signatureHex = toHex(signatureDer)

            const header = `# DSS (DSA) signature
# Type: file
# Hash: SHA-1
# Original: ${file.filename || 'file'}
# Size: ${sizeBytes} bytes
# Generated: ${new Date().toISOString()}

`

            await writeFile(outPath, header + signatureHex + '\n', 'utf8')

            return {
                signatureHex,
                sizeBytes,
                signatureFile: `/exports/${basename(outPath)}`,
                signatureFileName: outName,
            }
        },
    })
})
