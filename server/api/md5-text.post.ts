import { md5Hex } from '~/server/lib/md5'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, basename } from 'node:path'
import { sanitizeBaseName } from '~/server/utils/sanitizeBaseName'

type Body = { text: string, name?: string }

export default defineEventHandler(async (event) => {
    const body = await readBody<Body>(event)
    const text = body?.text

    if (typeof text !== 'string')
        throw createError({ statusCode: 400, statusMessage: 'text must be a string' })

    const hash = md5Hex(text)

    const dir = join(process.cwd(), 'public', 'exports')
    await mkdir(dir, { recursive: true })

    const base = sanitizeBaseName(body?.name ?? 'text')
    const fileName = `md5_text_${Date.now()}_${base}.md5`
    const filePath = join(dir, fileName)

    const header = `# MD5 (RFC 1321)
# Type: text
# BaseName: ${base}
# Generated: ${new Date().toISOString()}

`
    await writeFile(filePath, header + hash + '\n', 'utf8')

    return {
        hash,
        file: `/exports/${basename(filePath)}`,
        fileName,
    }
})
