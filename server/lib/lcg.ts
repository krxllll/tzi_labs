// 1) LCG
export function lcgNext(x: number, a: number, c: number, m: number) {
    return (a * x + c) % m
}
export function lcgSequence(count: number, a: number, c: number, m: number, seed: number) {
    const out: number[] = []
    let x = seed
    for (let i = 0; i < count; i++) {
        x = lcgNext(x, a, c, m)
        out.push(x)
    }
    return out
}

// 2) LCG Period
export function lcgPeriod(a: number, c: number, m: number, seed: number) {
    let x = seed
    let t = 0
    do {
        x = lcgNext(x, a, c, m)
        t++
        if (t > m + 1) break
    } while (x !== seed)
    return t
}

// 3) GCD
export function gcd(a: number, b: number) {
    a = Math.abs(a); b = Math.abs(b)
    while (b !== 0) { const r = a % b; a = b; b = r }
    return a
}

// 4) Cesaro's test
export function cesaroPiEstimate(pairs: Array<[number, number]>) {
    let coprime = 0
    for (const [u, v] of pairs) if (gcd(u, v) === 1) coprime++
    const p = coprime / pairs.length
    const pi = Math.sqrt(6 / p)
    return { pi, p, coprime, total: pairs.length }
}

// 5) LCG Pairs
export function lcgPairs(nPairs: number, a: number, c: number, m: number, seed: number) {
    const pairs: Array<[number, number]> = []
    let x = seed
    for (let i = 0; i < nPairs; i++) {
        x = lcgNext(x, a, c, m); const u = x || 1
        x = lcgNext(x, a, c, m); const v = x || 1
        pairs.push([u, v])
    }
    return pairs
}

// 6) Lehmer (Park–Miller)
export const LEHMER = {
    m: 2147483647,       // 2^31−1
    a: 16807,            // 7^5
}
export function lehmerNext(x: number) {
    return (LEHMER.a * x) % LEHMER.m
}
export function lehmerPairs(nPairs: number, seed: number) {
    const pairs: Array<[number, number]> = []
    let x = seed || 1
    for (let i = 0; i < nPairs; i++) {
        x = lehmerNext(x); const u = x
        x = lehmerNext(x); const v = x
        pairs.push([u, v])
    }
    return pairs
}

// 7) System Pairs
export function systemPairs(nPairs: number, R = 1_000_000) {
    const pairs: Array<[number, number]> = []
    for (let i = 0; i < nPairs; i++) {
        const u = 1 + Math.floor(Math.random() * R)
        const v = 1 + Math.floor(Math.random() * R)
        pairs.push([u, v])
    }
    return pairs
}
