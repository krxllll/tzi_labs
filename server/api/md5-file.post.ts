import { runMultipartOneFile } from '~/server/utils/multipart'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { MD5 } from '~/server/lib/md5'
import { sanitizeBaseName } from '~/server/utils/sanitizeBaseName'

function hashStreamMd5(stream: NodeJS.ReadableStream) {
    const md5 = new MD5()
    let sizeBytes = 0

    return new Promise<{ hash: string; sizeBytes: number }>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
            sizeBytes += chunk.length
            md5.update(chunk)
        })
        stream.on('error', reject)
        stream.on('end', () => {
            resolve({ hash: md5.digestHex(), sizeBytes })
        })
    })
}

export default defineEventHandler(async (event) => {
    const { fileUrl, fileName, hash, originalName, sizeBytes } = await runMultipartOneFile(
        event.node.req,
        {
            start: async ({ file, filename }, fields) => {
                const dir = join(process.cwd(), 'public', 'exports')
                await mkdir(dir, { recursive: true })

                const suggestedName = (fields.name ?? '').trim() || null
                const originalName = filename || 'file'

                const { hash, sizeBytes } = await hashStreamMd5(file)

                const base = sanitizeBaseName(suggestedName ?? originalName)
                const outName = `md5_file_${Date.now()}_${base}.md5`
                const outPath = join(dir, outName)

                const header = `# MD5 (RFC 1321)
# Type: file
# Original: ${originalName}
# Size: ${sizeBytes} bytes
# Generated: ${new Date().toISOString()}

`

                await writeFile(outPath, header + hash + '\n', 'utf8')

                return {
                    hash,
                    originalName,
                    sizeBytes,
                    fileUrl: `/exports/${basename(outPath)}`,
                    fileName: outName,
                }
            },
        }
    )

    return {
        hash,
        originalName,
        sizeBytes,
        file: fileUrl,
        fileName,
    }
})
