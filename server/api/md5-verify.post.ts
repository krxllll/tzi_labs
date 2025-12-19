import Busboy from 'busboy'
import { MD5 } from '~/lib/md5'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, basename } from 'node:path'

function extractMd5Hex(text: string): string | null {
    const m = text.match(/[a-fA-F0-9]{32}/)
    return m ? m[0].toLowerCase() : null
}

function sanitizeBaseName(name: string) {
    const cleaned = name
        .trim()
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\s+/g, '_')
    return cleaned.replace(/\.(md5|txt)$/i, '') || 'verify'
}

export default defineEventHandler(async (event) => {
    const req = event.node.req
    const contentType = req.headers['content-type'] || ''
    if (!contentType.includes('multipart/form-data')) {
        throw createError({ statusCode: 400, statusMessage: 'Expected multipart/form-data' })
    }

    const dir = join(process.cwd(), 'public', 'exports')
    await mkdir(dir, { recursive: true })

    const bb = Busboy({ headers: req.headers })

    let targetName = 'file'
    let md5FileName = 'hash.md5'
    let sizeBytes = 0

    const md5 = new MD5()
    let md5Text = ''

    const done = new Promise<any>((resolve, reject) => {
        bb.on('file', (field, fileStream, info) => {
            if (field === 'file') {
                targetName = info?.filename || 'file'
                fileStream.on('data', (chunk: Buffer) => {
                    sizeBytes += chunk.length
                    md5.update(chunk)
                })
                fileStream.on('error', reject)
            } else if (field === 'md5') {
                md5FileName = info?.filename || 'hash.md5'
                fileStream.setEncoding('utf8')
                fileStream.on('data', (chunk: string) => { md5Text += chunk })
                fileStream.on('error', reject)
            } else {
                fileStream.resume()
            }
        })

        bb.on('error', reject)

        bb.on('finish', async () => {
            try {
                const expected = extractMd5Hex(md5Text)
                if (!expected) {
                    reject(createError({ statusCode: 400, statusMessage: 'MD5 hex not found in md5 file' }))
                    return
                }

                const actual = md5.digestHex()
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

                resolve({
                    ok,
                    expected,
                    actual,
                    reportFile: `/exports/${basename(reportPath)}`,
                    reportFileName,
                })
            } catch (e) {
                reject(e)
            }
        })
    })

    req.pipe(bb)
    return await done
})
