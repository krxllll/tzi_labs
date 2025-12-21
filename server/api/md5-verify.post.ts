import { runMultipartFiles } from '~/server/utils/multipart'
import { MD5 } from '~/server/lib/md5'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { sanitizeBaseName } from '~/server/utils/sanitizeBaseName'

function extractMd5Hex(text: string): string | null {
    const m = text.match(/[a-fA-F0-9]{32}/)
    return m ? m[0].toLowerCase() : null
}

function hashStreamMd5(stream: NodeJS.ReadableStream) {
    const md5 = new MD5()
    let sizeBytes = 0

    return new Promise<{ hash: string; sizeBytes: number }>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
            sizeBytes += chunk.length
            md5.update(chunk)
        })
        stream.on('error', reject)
        stream.on('end', () => resolve({ hash: md5.digestHex(), sizeBytes }))
    })
}

function readTextStream(stream: NodeJS.ReadableStream) {
    let text = ''
    return new Promise<string>((resolve, reject) => {
        ;(stream as any).setEncoding?.('utf8')
        stream.on('data', (chunk: string | Buffer) => {
            text += typeof chunk === 'string' ? chunk : chunk.toString('utf8')
        })
        stream.on('error', reject)
        stream.on('end', () => resolve(text))
    })
}

export default defineEventHandler(async (event) => {
    const req = event.node.req

    return await runMultipartFiles(req, {
        requiredFiles: ['file', 'md5'],
        start: async ({ files }) => {
            const dir = join(process.cwd(), 'public', 'exports')
            await mkdir(dir, {recursive: true})

            const target = files['file']
            const md5f = files['md5']

            if (!target || !md5f) {
                throw createError({ statusCode: 400, statusMessage: 'Missing required files' })
            }

            const targetName = target.filename || 'file'
            const md5FileName = md5f.filename || 'hash.md5'

            const [{ hash: actual, sizeBytes }, md5Text] = await Promise.all([
                hashStreamMd5(target.file),
                readTextStream(md5f.file),
            ])

            const expected = extractMd5Hex(md5Text)
            if (!expected) {
                throw createError({statusCode: 400, statusMessage: 'MD5 hex not found in md5 file'})
            }

            const ok = actual === expected

            const base = sanitizeBaseName(targetName)
            const reportFileName = `md5_verify_${Date.now()}_${base}.txt`
            const reportPath = join(dir, reportFileName)

            const report = `# MD5 Verify
# Target: ${targetName}
# Size: ${sizeBytes} bytes
# MD5 file: ${md5FileName}
# Expected: ${expected}
# Actual:   ${actual}
# Result:   ${ok ? 'OK' : 'FAIL'}
# Generated: ${new Date().toISOString()}

`

            await writeFile(reportPath, report, 'utf8')

            return {
                ok,
                expected,
                actual,
                reportFile: `/exports/${basename(reportPath)}`,
                reportFileName,
            }
        },
    })
})
