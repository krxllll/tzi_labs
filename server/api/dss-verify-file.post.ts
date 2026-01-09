import { runMultipartFiles } from '~/server/utils/multipart'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { sanitizeBaseName } from '~/server/utils/sanitizeBaseName'
import { fromHex, verifyStreamDssSha1 } from '~/server/lib/dss'
import { readKeyFromMultipart, streamToString } from '~/server/utils/cryptoKey'

function extractHexSignature(text: string): string | null {
    const m = (text ?? '').match(/[a-fA-F0-9]{40,}/)
    return m ? m[0] : null
}

export default defineEventHandler(async (event) => {
    return await runMultipartFiles(event.node.req, {
        requiredFiles: ['file', 'sig'],
        start: async ({ files, fields }) => {
            const file = files.file
            const sigFile = files.sig
            if (!file) throw createError({ statusCode: 400, statusMessage: 'Missing file' })
            if (!sigFile) throw createError({ statusCode: 400, statusMessage: 'Missing sig file' })

            const { pem: publicKeyPem } = await readKeyFromMultipart(files as any, fields, 'publicKey')

            const sigText = await streamToString(sigFile.file)
            const sigHex = extractHexSignature(sigText)
            if (!sigHex) throw createError({ statusCode: 400, statusMessage: 'Signature hex not found in sig file' })

            const signatureDer = fromHex(sigHex)
            const { ok, sizeBytes } = await verifyStreamDssSha1(file.file, signatureDer, publicKeyPem)

            const dir = join(process.cwd(), 'public', 'exports')
            await mkdir(dir, { recursive: true })

            const base = sanitizeBaseName(file.filename || 'file')
            const reportName = `dss_verify_${Date.now()}_${base}.txt`
            const reportPath = join(dir, reportName)

            const report = `# DSS Verify
# Target: ${file.filename || 'file'}
# Size: ${sizeBytes} bytes
# Sig file: ${sigFile.filename || 'signature.sig'}
# Hash: SHA-1
# Result: ${ok ? 'OK' : 'FAIL'}
# Generated: ${new Date().toISOString()}

`

            await writeFile(reportPath, report, 'utf8')

            return {
                ok,
                sizeBytes,
                reportFile: `/exports/${basename(reportPath)}`,
                reportFileName: reportName,
            }
        },
    })
})
