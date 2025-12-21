import { LCG_VARIANT } from '~/server/lib/variant'
import { cesaroPiEstimate, lcgPairs, lehmerPairs, systemPairs } from '~/server/lib/lcg'

type Body = { pairs: number, seed?: number }

export default defineEventHandler(async (event) => {
    const { pairs, seed = 1 } = await readBody<Body>(event)
    if (!Number.isInteger(pairs) || pairs <= 0)
        throw createError({ statusCode: 400, statusMessage: 'pairs must be positive integer' })
    if (pairs > 5_000_000) {
        throw createError({ statusCode: 413, statusMessage: 'pairs too large' })
    }

    const lcg = cesaroPiEstimate(lcgPairs(pairs, LCG_VARIANT.a, LCG_VARIANT.c, LCG_VARIANT.m, LCG_VARIANT.seed))
    const lehmer = cesaroPiEstimate(lehmerPairs(pairs, seed))
    const system = cesaroPiEstimate(systemPairs(pairs))

    return {
        pairs,
        results: {
            lcg, lehmer, system,
        }
    }
})
