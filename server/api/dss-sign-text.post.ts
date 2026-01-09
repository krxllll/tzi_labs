import { runMultipartFiles } from '~/server/utils/multipart'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { sanitizeBaseName } from '~/server/utils/sanitizeBaseName'
import { signTextDssSha1, toHex } from '~/server/lib/dss'
import { readKeyFromMultipart } from '~/server/utils/cryptoKey'

export default defineEventHandler(async (event) => {
    return await runMultipartFiles(event.node.req, {
        requiredFields: ['text'],
        requiredFiles: [],
        start: async ({ files, fields }) => {
            const { pem: privateKeyPem } = await readKeyFromMultipart(files as any, fields, 'privateKey')

            const text = fields.text ?? ''
            const sigDer = signTextDssSha1(text, privateKeyPem)
            const signatureHex = toHex(sigDer)

            const dir = join(process.cwd(), 'public', 'exports')
            await mkdir(dir, { recursive: true })

            const base = sanitizeBaseName((fields.name ?? '').trim() || 'text')
            const outName = `dss_text_sig_${Date.now()}_${base}.sig`
            const outPath = join(dir, outName)

            const header = `# DSS (DSA) signature
# Type: text
# Hash: SHA-1
# Bytes: ${Buffer.byteLength(text, 'utf8')}
# Generated: ${new Date().toISOString()}

`

            await writeFile(outPath, header + signatureHex + '\n', 'utf8')

            return {
                signatureHex,
                signatureFile: `/exports/${basename(outPath)}`,
                signatureFileName: outName,
            }
        },
    })
})
