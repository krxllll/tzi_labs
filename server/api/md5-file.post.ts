import Busboy from 'busboy'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { MD5 } from '~/lib/md5'

function sanitizeBaseName(name: string) {
    const cleaned = name
        .trim()
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\s+/g, '_')
    return cleaned.replace(/\.(md5|txt)$/i, '') || 'file'
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

    let originalName = 'file'
    let sizeBytes = 0
    const md5 = new MD5()

    let suggestedName: string | null = null

    const done = new Promise<any>((resolve, reject) => {
        bb.on('field', (name, val) => {
            if (name === 'name') suggestedName = String(val || '').trim() || null
        })

        bb.on('file', (field, fileStream, info) => {
            if (field !== 'file') {
                fileStream.resume()
                return
            }

            originalName = info?.filename || 'file'

            fileStream.on('data', (chunk: Buffer) => {
                sizeBytes += chunk.length
                md5.update(chunk)
            })

            fileStream.on('error', reject)

            fileStream.on('end', async () => {
                try {
                    const hash = md5.digestHex()

                    const base = sanitizeBaseName(suggestedName ?? originalName)
                    const fileName = `md5_file_${Date.now()}_${base}.md5`
                    const filePath = join(dir, fileName)

                    const header = `# MD5 (RFC 1321)
# Type: file
# Original: ${originalName}
# Size: ${sizeBytes} bytes
# Generated: ${new Date().toISOString()}

`
                    await writeFile(filePath, header + hash + '\n', 'utf8')

                    resolve({
                        hash,
                        originalName,
                        sizeBytes,
                        file: `/exports/${basename(filePath)}`,
                        fileName,
                    })
                } catch (e) {
                    reject(e)
                }
            })
        })

        bb.on('error', reject)
        bb.on('finish', () => {
        })
    })

    req.pipe(bb)
    return await done
})
