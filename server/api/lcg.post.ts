import { VARIANT } from '~/lib/variant'
import { lcgSequence, lcgPeriod } from '~/lib/lcg'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, basename } from 'node:path'

type Body = { count: number, m?: number, a?: number, c?: number, seed?: number }

export default defineEventHandler(async (event) => {
    const body = await readBody<Body>(event)

    const count = body.count
    const m = body.m ?? VARIANT.m
    const a = body.a ?? VARIANT.a
    const c = body.c ?? VARIANT.c
    const seed = body.seed ?? VARIANT.seed

    if (!Number.isInteger(count) || count <= 0)
        throw createError({ statusCode: 400, statusMessage: 'count must be positive integer' })
    if (!Number.isInteger(m) || m <= 0)
        throw createError({ statusCode: 400, statusMessage: 'modulus must be positive integer' })
    if (!Number.isInteger(a) || a <= 0 || a >= m)
        throw createError({ statusCode: 400, statusMessage: 'multiplier must be positive integer less than modulus' })
    if (!Number.isInteger(c) || c < 0 || c >= m)
        throw createError({ statusCode: 400, statusMessage: 'increment must be positive integer less than modulus or zero' })
    if (!Number.isInteger(seed) || seed < 0 || seed >= m)
        throw createError({ statusCode: 400, statusMessage: 'seed must be positive integer less than modulus or zero' })

    const seq = lcgSequence(count, a, c, m, seed)
    const period = lcgPeriod(a, c, m, seed)

    const dir = join(process.cwd(), 'public', 'exports')
    await mkdir(dir, { recursive: true })
    const name = `lcg_${Date.now()}_m${m}_a${a}_c${c}_x0${seed}.txt`
    const filePath = join(dir, name)
    const header = `# Linear Congruential Generator
# m=${m}, a=${a}, c=${c}, seed=${seed}, count=${count}, period=${period}
# Generated: ${new Date().toISOString()}

`
    await writeFile(filePath, header + seq.join('\n'), 'utf8')
    const fileUrl = `/exports/${basename(filePath)}`

    return {
        params: { m, a, c, seed },
        count,
        period,
        file: fileUrl,
        fileName: name,
        data: seq,
    }
})
