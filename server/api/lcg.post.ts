import { VARIANT } from '~/lib/variant'
import { lcgSequence, lcgPeriod } from '~/lib/lcg'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'

type Body = { count: number, saveToFile?: boolean }

export default defineEventHandler(async (event) => {
    const { count, saveToFile } = await readBody<Body>(event)

    if (!Number.isInteger(count) || count <= 0)
        throw createError({ statusCode: 400, statusMessage: 'count must be positive integer' })

    const seq = lcgSequence(count, VARIANT.a, VARIANT.c, VARIANT.m, VARIANT.seed)
    const period = lcgPeriod(VARIANT.a, VARIANT.c, VARIANT.m, VARIANT.seed)

    let filePath: string | null = null
    if (saveToFile) {
        const dir = join(process.cwd(), 'public', 'exports')
        await mkdir(dir, { recursive: true })
        const name = `lcg_${Date.now()}_m${VARIANT.m}_a${VARIANT.a}_c${VARIANT.c}_x0${VARIANT.seed}.txt`
        filePath = join(dir, name)
        await writeFile(filePath, seq.join('\n'), 'utf8')
    }

    return {
        params: VARIANT,
        count,
        period,
        saved: !!saveToFile,
        file: filePath ? `/exports/${filePath.split('\\').pop()}` : null,
        data: seq,
    }
})
