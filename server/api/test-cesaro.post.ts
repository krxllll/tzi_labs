import { VARIANT } from '~/lib/variant'
import { cesaroPiEstimate, lcgPairs, lehmerPairs, systemPairs } from '~/lib/lcg'

type Body = { pairs: number, seed?: number }

export default defineEventHandler(async (event) => {
    const { pairs, seed = 1 } = await readBody<Body>(event)
    if (!Number.isInteger(pairs) || pairs <= 0)
        throw createError({ statusCode: 400, statusMessage: 'pairs must be positive integer' })
    if (pairs > 5_000_000) {
        throw createError({ statusCode: 413, statusMessage: 'pairs too large' })
    }

    const lcg = cesaroPiEstimate(lcgPairs(pairs, VARIANT.a, VARIANT.c, VARIANT.m, VARIANT.seed))
    const lehmer = cesaroPiEstimate(lehmerPairs(pairs, seed))
    const system = cesaroPiEstimate(systemPairs(pairs))

    return {
        pairs,
        results: {
            lcg, lehmer, system,
        }
    }
})
